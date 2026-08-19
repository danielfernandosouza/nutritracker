import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe base config — no providers/Prisma here. Middleware imports only this
 * file to verify the session JWT without pulling in the Node-only Prisma client.
 */
const SIXTY_DAYS = 60 * 60 * 24 * 60;

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt", maxAge: SIXTY_DAYS, updateAge: 60 * 60 * 24 },
  jwt: { maxAge: SIXTY_DAYS },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = (user as { id: string }).id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
};
