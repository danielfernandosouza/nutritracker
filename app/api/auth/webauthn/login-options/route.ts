import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
import { prisma } from "@/lib/db";
import { getRpConfig, signChallenge } from "@/lib/webauthn";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { email?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Informe o e-mail." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email }, include: { authenticators: true } });
  if (!user || user.authenticators.length === 0) {
    return NextResponse.json({ error: "Nenhuma biometria cadastrada para esse e-mail." }, { status: 404 });
  }

  const { rpID } = getRpConfig(request);

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: user.authenticators.map((a) => ({
      id: Buffer.from(a.credentialID, "base64url"),
      type: "public-key" as const,
      transports: a.transports?.split(",") as AuthenticatorTransportFuture[] | undefined,
    })),
  });

  const token = signChallenge({
    challenge: options.challenge,
    userId: user.id,
    purpose: "login",
    exp: Date.now() + 5 * 60 * 1000,
  });

  return NextResponse.json({ options, token });
}
