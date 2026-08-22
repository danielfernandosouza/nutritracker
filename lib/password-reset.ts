import crypto from "node:crypto";

export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateResetToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, tokenHash: hashResetToken(token) };
}
