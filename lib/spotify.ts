import crypto from "node:crypto";
import { prisma } from "@/lib/db";

export const SPOTIFY_SCOPES = [
  "user-read-playback-state",
  "user-read-currently-playing",
  "user-modify-playback-state",
].join(" ");

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

/** Renova o token um pouco antes de expirar, para uma requisição não morrer no meio do caminho. */
const REFRESH_MARGIN_MS = 60_000;

export function getSpotifyCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/** Redirect URI derivada da origem da requisição — precisa bater exatamente com a cadastrada no painel do Spotify. */
export function getSpotifyRedirectUri(origin: string): string {
  return `${origin}/api/spotify/callback`;
}

function basicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

type StatePayload = { userId: string; nonce: string; exp: number };

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurado.");
  return secret;
}

/**
 * `state` assinado do OAuth: protege contra CSRF e carrega quem iniciou o fluxo, para o callback
 * não depender só do cookie de sessão na volta do redirecionamento externo. Auto-contido, sem
 * estado no servidor — mesmo princípio já usado nos desafios do WebAuthn.
 */
export function signState(userId: string): string {
  const payload: StatePayload = {
    userId,
    nonce: crypto.randomBytes(16).toString("base64url"),
    exp: Date.now() + 10 * 60 * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyState(token: string): StatePayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expectedSig = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as StatePayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<TokenResponse | null> {
  const creds = getSpotifyCredentials();
  if (!creds) return null;

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(creds.clientId, creds.clientSecret),
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
  });
  if (!res.ok) return null;
  return (await res.json()) as TokenResponse;
}

/**
 * Devolve um access token válido para o usuário, renovando quando necessário. Null quando a conta
 * não está conectada ou quando o refresh foi recusado (ex: acesso revogado no Spotify) — nesse
 * caso a conta é removida para o app voltar a oferecer "conectar".
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.spotifyAccount.findUnique({ where: { userId } });
  if (!account) return null;

  if (account.expiresAt.getTime() - REFRESH_MARGIN_MS > Date.now()) {
    return account.accessToken;
  }

  const creds = getSpotifyCredentials();
  if (!creds) return null;

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(creds.clientId, creds.clientSecret),
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: account.refreshToken }),
  });

  if (!res.ok) {
    await prisma.spotifyAccount.deleteMany({ where: { userId } });
    return null;
  }

  const json = (await res.json()) as TokenResponse;
  await prisma.spotifyAccount.update({
    where: { userId },
    data: {
      accessToken: json.access_token,
      // O Spotify nem sempre devolve um refresh token novo; quando não devolve, o antigo continua valendo.
      refreshToken: json.refresh_token ?? account.refreshToken,
      expiresAt: new Date(Date.now() + json.expires_in * 1000),
    },
  });
  return json.access_token;
}

/** Chamada autenticada à Web API do Spotify. Devolve o status para o chamador decidir o que fazer. */
export async function spotifyFetch(
  accessToken: string,
  path: string,
  init?: { method?: string; body?: string },
): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body,
    cache: "no-store",
  });
}
