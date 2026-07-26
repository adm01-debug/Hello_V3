/**
 * Identidade legível do dispositivo atual.
 *
 * Usada apenas para exibir "alterado em <dispositivo>" nas preferências
 * sincronizadas. Não é identificador de segurança: é um rótulo cosmético,
 * derivado do user agent, e nunca deve ser usado para autorização.
 *
 * Todas as funções são puras (exceto o acesso opcional ao localStorage) para
 * permitir testes baseados em propriedades.
 */

const STORAGE_KEY = 'lovable.device-label';
export const MAX_DEVICE_LABEL_LENGTH = 60;
export const FALLBACK_DEVICE_LABEL = 'Dispositivo desconhecido';

/**
 * Normaliza um rótulo vindo do banco, do storage ou do user agent.
 * Colapsa espaços, remove caracteres de controle e trunca no limite do CHECK.
 */
export function sanitizeDeviceLabel(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleaned.length === 0) return null;
  return cleaned.slice(0, MAX_DEVICE_LABEL_LENGTH).trim() || null;
}

/** Deriva um nome amigável ("Chrome em Windows") a partir do user agent. */
export function detectDeviceLabel(userAgent: string | null | undefined): string {
  const ua = typeof userAgent === 'string' ? userAgent : '';

  const os =
    /Windows/i.test(ua) ? 'Windows'
    : /iPhone|iPad|iPod/i.test(ua) ? 'iOS'
    : /Android/i.test(ua) ? 'Android'
    : /Mac OS X|Macintosh/i.test(ua) ? 'macOS'
    : /Linux/i.test(ua) ? 'Linux'
    : null;

  // Ordem importa: Edge e Opera também anunciam "Chrome".
  const browser =
    /Edg\//i.test(ua) ? 'Edge'
    : /OPR\/|Opera/i.test(ua) ? 'Opera'
    : /Firefox\//i.test(ua) ? 'Firefox'
    : /Chrome\//i.test(ua) ? 'Chrome'
    : /Safari\//i.test(ua) ? 'Safari'
    : null;

  if (browser && os) return `${browser} em ${os}`;
  if (browser) return browser;
  if (os) return os;
  return FALLBACK_DEVICE_LABEL;
}

/**
 * Rótulo do dispositivo atual, estável entre sessões quando há localStorage.
 * Em modo privado/quota estourada degrada para o valor derivado do user agent.
 */
export function getCurrentDeviceLabel(): string {
  const derived = sanitizeDeviceLabel(
    detectDeviceLabel(typeof navigator === 'undefined' ? null : navigator.userAgent),
  ) ?? FALLBACK_DEVICE_LABEL;

  if (typeof window === 'undefined') return derived;

  try {
    const stored = sanitizeDeviceLabel(window.localStorage.getItem(STORAGE_KEY));
    if (stored) return stored;
    window.localStorage.setItem(STORAGE_KEY, derived);
  } catch {
    // Storage indisponível: o rótulo derivado ainda é válido nesta sessão.
  }
  return derived;
}

/** Permite ao usuário apelidar a estação de trabalho. Retorna o valor aplicado. */
export function setCurrentDeviceLabel(value: unknown): string {
  const sanitized = sanitizeDeviceLabel(value) ?? FALLBACK_DEVICE_LABEL;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, sanitized);
    } catch {
      // Ignorado por design.
    }
  }
  return sanitized;
}

/** Formata a origem da última alteração para exibição na UI. */
export function formatRemoteOrigin(device: string | null, at: number | null): string {
  const label = sanitizeDeviceLabel(device);
  const base = label ? `Toque atualizado em ${label}` : 'Toque atualizado em outro dispositivo';
  if (at === null || !Number.isFinite(at)) return base;
  const time = new Date(at);
  if (Number.isNaN(time.getTime())) return base;
  return `${base} às ${time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}
