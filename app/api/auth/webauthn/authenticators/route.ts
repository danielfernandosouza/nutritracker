import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/** Remove toda biometria cadastrada para o usuário, liberando um recadastro do zero. */
export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.authenticator.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
