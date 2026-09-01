/**
 * Cookie lido pelo proxy.ts para barrar as telas internas antes de renderizar qualquer coisa.
 * Não guarda segredo nenhum, só sinaliza que este dispositivo já passou pela reautenticação — a
 * autorização de verdade continua sendo a sessão do NextAuth.
 */
export const UNLOCK_COOKIE_NAME = "ntl_unlocked";

/**
 * Marca na memória da página de que ESTE documento passou pela reautenticação. É o único sinal
 * confiável de "o app foi fechado e reaberto": cookie de sessão e storage do navegador são
 * restaurados pelo Chrome quando o PWA reabre, mas nada restaura uma variável em memória — abrir
 * o app de novo sempre começa com ela zerada. Vive em `window` (e não como variável de módulo)
 * para não correr o risco de o bundler duplicar o módulo entre as telas de login e as internas,
 * o que deixaria o app preso num laço de bloqueio.
 */
const DOCUMENT_UNLOCKED_FLAG = "__nutritrackerUnlocked";

/**
 * Momento em que o app esteve ativo pela última vez, para o caso em que ele não foi fechado, só
 * ficou em segundo plano (aí o documento continua vivo e a marca acima permanece).
 */
const LAST_ACTIVE_KEY = "nutritracker:last-active";

/**
 * Tempo em segundo plano a partir do qual o app volta a exigir biometria/senha mesmo sem ter sido
 * fechado. Curto o bastante para proteger quem deixa o celular na mesa, com folga só para quem sai
 * por alguns segundos e volta.
 */
const LOCK_AFTER_BACKGROUND_MS = 30_000;

type UnlockWindow = Window & { [DOCUMENT_UNLOCKED_FLAG]?: boolean };

export function markUnlocked() {
  document.cookie = `${UNLOCK_COOKIE_NAME}=1; path=/; samesite=lax`;
  (window as UnlockWindow)[DOCUMENT_UNLOCKED_FLAG] = true;
  touchActive();
}

export function clearUnlock() {
  document.cookie = `${UNLOCK_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
  (window as UnlockWindow)[DOCUMENT_UNLOCKED_FLAG] = false;
  try {
    localStorage.removeItem(LAST_ACTIVE_KEY);
  } catch {
    // localStorage indisponível (modo privado/bloqueado) — a marca em memória já cobre o caso.
  }
}

export function touchActive() {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  } catch {
    // idem
  }
}

/** true quando o app precisa exigir biometria/senha de novo antes de mostrar as telas internas. */
export function shouldLock(): boolean {
  // App reaberto (documento novo): trava sempre, sem tolerância de tempo — é exatamente o
  // "fechei e abri de novo".
  if (!(window as UnlockWindow)[DOCUMENT_UNLOCKED_FLAG]) return true;

  // Mesmo documento, só voltou do segundo plano: trava se ficou fora tempo demais.
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_KEY);
    if (!raw) return true;
    const lastActive = Number(raw);
    if (!Number.isFinite(lastActive)) return true;
    return Date.now() - lastActive > LOCK_AFTER_BACKGROUND_MS;
  } catch {
    return false;
  }
}
