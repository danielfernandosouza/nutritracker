import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getRpConfig, signChallenge } from "@/lib/webauthn";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { rpID, rpName } = getRpConfig(request);
  const existing = await prisma.authenticator.findMany({ where: { userId: session.user.id } });

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: session.user.id,
    userName: session.user.email ?? "usuário",
    userDisplayName: session.user.name ?? undefined,
    attestationType: "none",
    excludeCredentials: existing.map((a) => ({
      id: Buffer.from(a.credentialID, "base64url"),
      type: "public-key" as const,
    })),
    authenticatorSelection: {
      // "discouraged" pede uma credencial NÃO descobrível, presa a este aparelho. Gerenciadores de
      // senha (Proton Pass, Samsung Pass, Google) em geral só armazenam credenciais descobríveis
      // (as "chaves de acesso"/passkeys sincronizadas), então com "discouraged" o Android tende a
      // resolver no autenticador do próprio aparelho — a digital, que é o que se espera aqui — em
      // vez de abrir a tela "escolha onde salvar sua chave de acesso". Podemos abrir mão de
      // credencial descobrível porque o app sempre manda o e-mail antes (ver login-options, que
      // preenche allowCredentials), nunca dependendo de login sem usuário.
      residentKey: "discouraged",
      userVerification: "required",
      authenticatorAttachment: "platform",
    },
  });

  const token = signChallenge({
    challenge: options.challenge,
    userId: session.user.id,
    purpose: "register",
    exp: Date.now() + 5 * 60 * 1000,
  });

  return NextResponse.json({ options, token });
}
