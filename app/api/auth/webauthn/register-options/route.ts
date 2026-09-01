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
      // "preferred" em vez de "required": o app sempre manda o e-mail primeiro em
      // login-options, então nunca precisou de credencial descobrível (resident/passkey). Uma
      // resident key costuma ser tratada pelo Android como passkey sincronizada pelo Google
      // Password Manager, que abre a própria tela de seleção/PIN em vez do sensor de digital
      // direto — "preferred" tende a manter a credencial como uma chave simples do aparelho.
      residentKey: "preferred",
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
