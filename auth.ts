import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON, AuthenticatorTransportFuture } from "@simplewebauthn/types";
import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";
import { getRpConfig, verifyChallenge } from "@/lib/webauthn";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    Credentials({
      id: "webauthn",
      name: "Biometria",
      credentials: {
        token: { label: "Token", type: "text" },
        response: { label: "Response", type: "text" },
      },
      async authorize(credentials, request) {
        const token = String(credentials?.token ?? "");
        const responseRaw = String(credentials?.response ?? "");
        if (!token || !responseRaw) return null;

        const payload = verifyChallenge(token);
        if (!payload || payload.purpose !== "login") return null;

        let response: AuthenticationResponseJSON;
        try {
          response = JSON.parse(responseRaw);
        } catch {
          return null;
        }

        const authenticator = await prisma.authenticator.findUnique({
          where: { credentialID: response.id },
        });
        if (!authenticator || authenticator.userId !== payload.userId) return null;

        const { rpID, origin } = getRpConfig(request);

        let verification;
        try {
          verification = await verifyAuthenticationResponse({
            response,
            expectedChallenge: payload.challenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            authenticator: {
              credentialID: Buffer.from(authenticator.credentialID, "base64url"),
              credentialPublicKey: new Uint8Array(authenticator.credentialPublicKey),
              counter: authenticator.counter,
              transports: authenticator.transports?.split(",") as AuthenticatorTransportFuture[] | undefined,
            },
          });
        } catch {
          return null;
        }

        if (!verification.verified) return null;

        await prisma.authenticator.update({
          where: { id: authenticator.id },
          data: { counter: verification.authenticationInfo.newCounter },
        });

        const user = await prisma.user.findUnique({ where: { id: authenticator.userId } });
        if (!user) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
