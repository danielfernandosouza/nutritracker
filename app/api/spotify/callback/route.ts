import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exchangeCodeForTokens, getSpotifyRedirectUri, verifyState } from "@/lib/spotify";

/** Volta pro Perfil sinalizando o resultado, já que o usuário chega aqui por redirecionamento do Spotify. */
function backToProfile(origin: string, status: "ok" | "erro") {
  return NextResponse.redirect(new URL(`/profile?spotify=${status}`, origin));
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  // O usuário pode ter recusado a autorização na tela do Spotify.
  if (!code || !state) return backToProfile(origin, "erro");

  const payload = verifyState(state);
  if (!payload) return backToProfile(origin, "erro");

  const tokens = await exchangeCodeForTokens(code, getSpotifyRedirectUri(origin));
  if (!tokens?.refresh_token) return backToProfile(origin, "erro");

  const data = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
  };

  await prisma.spotifyAccount.upsert({
    where: { userId: payload.userId },
    create: { userId: payload.userId, ...data },
    update: data,
  });

  return backToProfile(origin, "ok");
}
