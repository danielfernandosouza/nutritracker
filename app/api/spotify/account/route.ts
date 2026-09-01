import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/** Estado da conexão, para a tela de Perfil mostrar "conectar" ou "desconectar". */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [profile, account] = await Promise.all([
    prisma.profile.findUnique({ where: { id: session.user.id }, select: { spotifyEnabled: true } }),
    prisma.spotifyAccount.findUnique({ where: { userId: session.user.id }, select: { id: true } }),
  ]);

  return NextResponse.json({ enabled: !!profile?.spotifyEnabled, connected: !!account });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.spotifyAccount.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
