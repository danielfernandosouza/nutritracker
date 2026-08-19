import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (req.auth) return;

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.nextUrl.origin);
  return NextResponse.redirect(loginUrl);
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
  ],
};
