import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getSpotifyCredentials, getSpotifyRedirectUri, signState, SPOTIFY_SCOPES } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.redirect(new URL("/login", request.nextUrl.origin));

  const creds = getSpotifyCredentials();
  if (!creds) {
    return NextResponse.json({ error: "Integração com Spotify não configurada." }, { status: 503 });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: { spotifyEnabled: true },
  });
  if (!profile?.spotifyEnabled) {
    return NextResponse.json({ error: "Recurso não habilitado para esta conta." }, { status: 403 });
  }

  const params = new URLSearchParams({
    client_id: creds.clientId,
    response_type: "code",
    redirect_uri: getSpotifyRedirectUri(request.nextUrl.origin),
    scope: SPOTIFY_SCOPES,
    state: signState(session.user.id),
  });

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`);
}
