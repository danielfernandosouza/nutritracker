import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getSpotifyCredentials, getValidAccessToken, spotifyFetch } from "@/lib/spotify";

type PlayerStatus = {
  /** Recurso liberado para esta conta (flag em Profile) — quando false o mini-player nem aparece. */
  enabled: boolean;
  connected: boolean;
  playing: boolean;
  track: { name: string; artist: string; albumArt: string | null } | null;
  /** true quando não há nenhum dispositivo tocando: o app precisa pedir pra abrir o Spotify primeiro. */
  noDevice: boolean;
};

const OFF: PlayerStatus = { enabled: false, connected: false, playing: false, track: null, noDevice: false };

type SpotifyPlaybackResponse = {
  is_playing?: boolean;
  item?: {
    name?: string;
    artists?: { name: string }[];
    album?: { images?: { url: string }[] };
  } | null;
};

async function requireEnabledUser(): Promise<string | null> {
  const session = await auth();
  if (!session?.user) return null;
  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: { spotifyEnabled: true },
  });
  return profile?.spotifyEnabled ? session.user.id : null;
}

export async function GET() {
  if (!getSpotifyCredentials()) return NextResponse.json(OFF);

  const userId = await requireEnabledUser();
  if (!userId) return NextResponse.json(OFF);

  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return NextResponse.json({ ...OFF, enabled: true });

  const res = await spotifyFetch(accessToken, "/me/player");
  // 204 = nenhum dispositivo ativo (Spotify fechado no celular, por exemplo).
  if (res.status === 204) {
    return NextResponse.json({ enabled: true, connected: true, playing: false, track: null, noDevice: true });
  }
  if (!res.ok) {
    return NextResponse.json({ enabled: true, connected: true, playing: false, track: null, noDevice: true });
  }

  const json = (await res.json()) as SpotifyPlaybackResponse;
  const item = json.item ?? null;

  const status: PlayerStatus = {
    enabled: true,
    connected: true,
    playing: !!json.is_playing,
    track: item
      ? {
          name: item.name ?? "",
          artist: item.artists?.map((a) => a.name).join(", ") ?? "",
          albumArt: item.album?.images?.[item.album.images.length - 1]?.url ?? null,
        }
      : null,
    noDevice: false,
  };
  return NextResponse.json(status);
}

const ACTIONS = {
  play: { path: "/me/player/play", method: "PUT" },
  pause: { path: "/me/player/pause", method: "PUT" },
  next: { path: "/me/player/next", method: "POST" },
  previous: { path: "/me/player/previous", method: "POST" },
} as const;

export async function POST(request: NextRequest) {
  const userId = await requireEnabledUser();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const action = ACTIONS[body.action as keyof typeof ACTIONS];
  if (!action) return NextResponse.json({ error: "ação inválida" }, { status: 400 });

  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return NextResponse.json({ error: "Spotify não conectado." }, { status: 400 });

  const res = await spotifyFetch(accessToken, action.path, { method: action.method });

  // 404 = nenhum dispositivo ativo; 403 = conta sem Premium (a Web API só controla playback pra Premium).
  if (res.status === 404) {
    return NextResponse.json({ error: "Abra o Spotify no celular primeiro." }, { status: 409 });
  }
  if (res.status === 403) {
    return NextResponse.json({ error: "Controlar o Spotify exige uma conta Premium." }, { status: 403 });
  }
  if (!res.ok && res.status !== 204) {
    return NextResponse.json({ error: "Não consegui falar com o Spotify." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
