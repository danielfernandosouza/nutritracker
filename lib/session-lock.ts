/**
 * Cookie lido pelo proxy.ts para barrar as telas internas antes de renderizar qualquer coisa.
 * Não guarda segredo nenhum, só sinaliza que este dispositivo já passou pela reautenticação — a
 * autorização de verdade continua sendo a sessão do NextAuth.
 */
export const UNLOCK_COOKIE_NAME = "ntl_unlocked";

/**
 * Momento em que o app esteve ativo pela última vez. O cookie sozinho não serve para detectar
 * "fechei o app": o Chrome no Android restaura os cookies de sessão junto com o PWA, então ele
 * sobrevive ao fechamento e a trava nunca disparava. Comparar este carimbo de tempo com o relógio
 * na volta é o que realmente distingue "voltei agora" de "reabri depois de fechar".
 */
const LAST_ACTIVE_KEY = "nutritracker:last-active";

/**
 * Tempo em segundo plano a partir do qual o app volta a exigir biometria/senha. Curto o bastante
 * para proteger quem deixa o celular na mesa, longo o bastante para não punir quem sai do app por
 * alguns segundos para ver uma notificação e volta.
 */
const LOCK_AFTER_BACKGROUND_MS = 60_000;

export function markUnlocked() {
  document.cookie = `${UNLOCK_COOKIE_NAME}=1; path=/; samesite=lax`;
  touchActive();
}

export function clearUnlock() {
  document.cookie = `${UNLOCK_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
  try {
    localStorage.removeItem(LAST_ACTIVE_KEY);
  } catch {
    // localStorage indisponível (modo privado/bloqueado) — a trava por cookie já cobre o caso.
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
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_KEY);
    // Sem carimbo é o caso de instalação nova, storage limpo ou app reaberto sem ter passado pela
    // tela de login — trava por segurança.
    if (!raw) return true;
    const lastActive = Number(raw);
    if (!Number.isFinite(lastActive)) return true;
    return Date.now() - lastActive > LOCK_AFTER_BACKGROUND_MS;
  } catch {
    return false;
  }
}
