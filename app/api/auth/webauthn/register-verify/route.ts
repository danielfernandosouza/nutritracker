import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getRpConfig, verifyChallenge } from "@/lib/webauthn";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json()) as { token?: string; response?: RegistrationResponseJSON };
  const { token, response } = body;
  if (!token || !response) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const payload = verifyChallenge(token);
  if (!payload || payload.purpose !== "register" || payload.userId !== session.user.id) {
    return NextResponse.json({ error: "Desafio inválido ou expirado. Tente novamente." }, { status: 400 });
  }

  const { rpID, origin } = getRpConfig(request);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: payload.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível verificar a biometria." }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Não foi possível verificar a biometria." }, { status: 400 });
  }

  const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

  await prisma.authenticator.create({
    data: {
      userId: session.user.id,
      credentialID: Buffer.from(credentialID).toString("base64url"),
      credentialPublicKey: Buffer.from(credentialPublicKey),
      counter,
      transports: response.response.transports?.join(",") ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
