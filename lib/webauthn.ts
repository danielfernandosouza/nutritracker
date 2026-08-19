import crypto from "node:crypto";

export const RP_NAME = "NutriTracker";

/** Deriva rpID/origin a partir da requisição, pra bater com o domínio real (localhost em dev, o domínio da Vercel em produção). */
export function getRpConfig(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin") ?? url.origin;
  const rpID = new URL(origin).hostname;
  return { rpID, origin, rpName: RP_NAME };
}

type ChallengePayload = {
  challenge: string;
  userId: string;
  purpose: "register" | "login";
  exp: number;
};

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurado.");
  return secret;
}

/**
 * Assina o desafio do WebAuthn num token auto-contido (sem precisar guardar estado no servidor
 * entre a etapa de "options" e a de "verify" — funciona bem em serverless sem sessão fixa).
 */
export function signChallenge(payload: ChallengePayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyChallenge(token: string): ChallengePayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expectedSig = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as ChallengePayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
