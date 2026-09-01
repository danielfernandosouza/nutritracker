import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { UNLOCK_COOKIE_NAME } from "@/lib/session-lock";

const { auth } = NextAuth(authConfig);

// Páginas que, além de sessão válida, exigem o cookie de "destravado" desta abertura do app (ver
// lib/session-lock.ts) — a sessão do NextAuth dura 60 dias, então sozinha deixaria qualquer um que
// pegasse o celular já logado entrar direto, sem repetir biometria/senha, esvaziando o propósito
// da biometria. /setup fica de fora: é parte do fluxo de conta nova, antes do usuário decidir se
// quer ativar a biometria.
const LOCK_GATED_PATHS = ["/home", "/history", "/workouts", "/profile"];

export default auth((req) => {
  if (!req.auth) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  const isLockGated = LOCK_GATED_PATHS.some(
    (p) => req.nextUrl.pathname === p || req.nextUrl.pathname.startsWith(`${p}/`),
  );
  if (isLockGated && !req.cookies.get(UNLOCK_COOKIE_NAME)) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }
});

export const config = {
  matcher: [
    "/home",
    "/history",
    "/workouts",
    "/workouts/:path*",
    "/profile",
    "/setup",
    "/api/profile/:path*",
    "/api/meals/:path*",
    "/api/weight/:path*",
    "/api/workout-log/:path*",
    "/api/chat/:path*",
    "/api/water/:path*",
    "/api/sleep/:path*",
    "/api/exercise-sets/:path*",
  ],
};
