/**
 * Cookie de sessão do navegador (sem Max-Age — o navegador o apaga quando o app/aba fecha de
 * verdade, diferente do cookie de sessão do NextAuth que dura 60 dias) marcando que este
 * dispositivo já passou pela reautenticação (biometria ou senha) na abertura atual do app.
 * Não guarda segredo nenhum, só um sinal — a autorização de verdade continua sendo a sessão do
 * NextAuth, verificada pelo middleware.
 */
export const UNLOCK_COOKIE_NAME = "ntl_unlocked";

export function markUnlocked() {
  document.cookie = `${UNLOCK_COOKIE_NAME}=1; path=/; samesite=lax`;
}

export function isUnlocked(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c.startsWith(`${UNLOCK_COOKIE_NAME}=`));
}
