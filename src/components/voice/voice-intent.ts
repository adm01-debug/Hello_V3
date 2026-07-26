/**
 * Parser determinístico de intenções de voz em PT-BR.
 * Usado como camada rápida antes/depois da edge `voice-command`.
 */

export type VoiceAction = 'dial' | 'hangup' | 'mute' | 'unmute' | 'redial' | 'history' | 'none';

export interface VoiceIntent {
  action: VoiceAction;
  target?: string;
  raw: string;
}

const NUMBER_WORDS: Record<string, string> = {
  zero: '0', um: '1', uma: '1', dois: '2', duas: '2', tres: '3', quatro: '4',
  cinco: '5', seis: '6', meia: '6', sete: '7', oito: '8', nove: '9',
};

function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Converte palavras numéricas soltas em dígitos e extrai a sequência. */
export function extractDigits(text: string): string {
  const normalized = stripAccents(text.toLowerCase());
  const tokens = normalized.split(/[\s,.-]+/).filter(Boolean);
  const digits = tokens
    .map((token) => (/^\d+$/.test(token) ? token : NUMBER_WORDS[token] ?? ''))
    .join('');
  return digits;
}

/** Interpreta o texto transcrito e devolve a ação pretendida. */
export function parseVoiceIntent(rawInput: string): VoiceIntent {
  const raw = typeof rawInput === 'string' ? rawInput.trim() : '';
  if (!raw) return { action: 'none', raw: '' };

  const text = stripAccents(raw.toLowerCase());

  if (/(desligar|encerrar|finalizar|desliga)\b/.test(text)) return { action: 'hangup', raw };
  if (/(tirar|desativar|remover)\s+(o\s+)?mudo|desmutar/.test(text)) return { action: 'unmute', raw };
  if (/\bmudo\b|silenciar|mutar/.test(text)) return { action: 'mute', raw };
  if (/(repetir|refazer|rediscar|ultima chamada|ligar de novo)/.test(text)) return { action: 'redial', raw };
  if (/(abrir|ver|mostrar)\s+(o\s+)?historico|historico de chamadas/.test(text)) return { action: 'history', raw };

  const dialMatch = text.match(/(?:ligar|ligue|discar|disque|chamar|chame|telefonar)\s*(?:para|pro|pra|o|a)?\s*(.+)/);
  if (dialMatch) {
    const rest = dialMatch[1].trim();
    const digits = extractDigits(rest);
    return { action: 'dial', target: digits.length >= 3 ? digits : rest, raw };
  }

  const onlyDigits = extractDigits(text);
  if (onlyDigits.length >= 8) return { action: 'dial', target: onlyDigits, raw };

  return { action: 'none', raw };
}

/** Descrição amigável da ação, para feedback na UI. */
export function describeIntent(intent: VoiceIntent): string {
  switch (intent.action) {
    case 'dial':
      return `Ligando para ${intent.target ?? ''}`.trim();
    case 'hangup':
      return 'Encerrando a chamada';
    case 'mute':
      return 'Ativando o mudo';
    case 'unmute':
      return 'Desativando o mudo';
    case 'redial':
      return 'Repetindo a última chamada';
    case 'history':
      return 'Abrindo o histórico';
    default:
      return 'Não entendi o comando';
  }
}
