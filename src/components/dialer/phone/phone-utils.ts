/**
 * Utilidades puras do discador estilo telefone.
 * Mantidas fora dos componentes para permitir testes unitários diretos.
 */

/** Dígitos aceitos pelo teclado do discador. */
export const DIAL_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'] as const;

export const DIAL_LETTERS: Record<string, string> = {
  '1': '',
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
  '*': '',
  '0': '+',
  '#': '',
};

/** Remove caracteres não aceitos por um discador telefônico. */
export function sanitizeDialInput(raw: string): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[^0-9*#+]/g, '').slice(0, 20);
}

/**
 * Formata para exibição no display, no padrão brasileiro quando possível.
 * Ex.: 11987654321 -> (11) 98765-4321
 * Números com `+`, `*` ou `#` são exibidos sem máscara.
 */
export function formatPhoneDisplay(value: string): string {
  const clean = sanitizeDialInput(value);
  if (!clean) return '';
  if (/[+*#]/.test(clean)) return clean;

  const d = clean;
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length <= 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return d;
}

/** Um número é discável quando tem ao menos 3 caracteres úteis. */
export function isDialable(value: string): boolean {
  return sanitizeDialInput(value).length >= 3;
}

/** Formata segundos como mm:ss (ou hh:mm:ss acima de 1h). */
export function formatDuration(totalSeconds: number): string {
  const s = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
