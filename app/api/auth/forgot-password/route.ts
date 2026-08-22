import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateResetToken, RESET_TOKEN_TTL_MS } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";

/** Evita mandar vários e-mails seguidos se a pessoa clicar "enviar" mais de uma vez. */
const COOLDOWN_MS = 2 * 60 * 1000;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Informe seu e-mail." }, { status: 400 });

  // Sempre responde do mesmo jeito, exista ou não a conta — não dá pra alguém usar essa tela
  // pra descobrir quais e-mails têm cadastro no app.
  const genericResponse = NextResponse.json({ ok: true });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return genericResponse;

  const recent = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - COOLDOWN_MS) } },
    orderBy: { createdAt: "desc" },
  });
  if (recent) return genericResponse;

  const { token, tokenHash } = generateResetToken();
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });

  const resetUrl = `${request.nextUrl.origin}/reset-password?token=${token}`;
  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch {
    // não expõe erro de envio pro cliente — evita vazar detalhe de infra e enumeração de e-mail
  }

  return genericResponse;
}
