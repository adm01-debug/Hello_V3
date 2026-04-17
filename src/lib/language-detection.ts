/**
 * Detecção de idioma leve baseada em heurísticas de caracteres + stopwords.
 * Não substitui um modelo, mas oferece resposta instantânea para UI.
 */

export type SupportedLang = 'pt' | 'en' | 'es' | 'fr' | 'it' | 'de' | 'ja' | 'zh';

export const SUPPORTED_LANGS: { code: SupportedLang; label: string; flag: string }[] = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

const STOPWORDS: Record<SupportedLang, string[]> = {
  pt: ['que','não','com','para','você','está','uma','isso','muito','tudo','obrigado','bom dia','boa tarde'],
  en: ['the','and','you','for','with','this','that','have','what','thank','good morning','please'],
  es: ['que','con','para','está','usted','muy','gracias','buenos días','por favor','también'],
  fr: ['que','pour','avec','vous','très','merci','bonjour','aussi','aujourd'],
  it: ['che','per','con','molto','grazie','buongiorno','anche','sono','fare'],
  de: ['der','die','das','und','ich','sie','sehr','danke','guten tag','bitte','auch'],
  ja: [],
  zh: [],
};

export function detectLanguage(text: string): { lang: SupportedLang; confidence: number } {
  if (!text || text.trim().length < 2) return { lang: 'pt', confidence: 0 };
  const lower = text.toLowerCase();

  // Scripts CJK
  if (/[\u3040-\u30ff\u31f0-\u31ff]/.test(text)) return { lang: 'ja', confidence: 0.98 };
  if (/[\u4e00-\u9fff]/.test(text)) return { lang: 'zh', confidence: 0.95 };

  const scores: Record<SupportedLang, number> = { pt:0, en:0, es:0, fr:0, it:0, de:0, ja:0, zh:0 };
  for (const lang of Object.keys(STOPWORDS) as SupportedLang[]) {
    for (const w of STOPWORDS[lang]) {
      if (lower.includes(w)) scores[lang] += 1;
    }
  }
  // Diacríticos típicos
  if (/[ãõáéíóúâêôç]/i.test(text)) scores.pt += 1.2;
  if (/[ñ¿¡]/i.test(text)) scores.es += 1.5;
  if (/[àâçéèêëîïôûüÿœ]/i.test(text) && !/[ãõ]/i.test(text)) scores.fr += 1;
  if (/[äöüß]/i.test(text)) scores.de += 1.5;
  if (/[àèéìòù]/i.test(text)) scores.it += 0.7;

  let best: SupportedLang = 'pt';
  let max = scores.pt;
  for (const l of Object.keys(scores) as SupportedLang[]) {
    if (scores[l] > max) { max = scores[l]; best = l; }
  }
  const total = Object.values(scores).reduce((a,b) => a + b, 0) || 1;
  const confidence = Math.min(0.99, max / total);
  return { lang: best, confidence };
}

export function langLabel(code: string): string {
  return SUPPORTED_LANGS.find((l) => l.code === code)?.label ?? code;
}

export function langFlag(code: string): string {
  return SUPPORTED_LANGS.find((l) => l.code === code)?.flag ?? '🌐';
}

/** Locale completo (ex: "ja" -> "ja-JP") usado em cultural_hints */
export function toLocale(code: string): string {
  const map: Record<string, string> = {
    pt: 'pt-BR', en: 'en-US', es: 'es-ES', fr: 'fr-FR',
    it: 'it-IT', de: 'de-DE', ja: 'ja-JP', zh: 'zh-CN',
  };
  return map[code] ?? code;
}
