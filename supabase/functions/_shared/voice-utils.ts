/**
 * Utilitários de biometria de voz (sem dependências externas).
 * Trabalha com vetores numéricos (features acústicas extraídas no client-side).
 */

export interface VoiceFeatures {
  /** Vetor de features (ex.: MFCC médios, pitch, etc.) - dimensão livre. */
  embedding: number[];
  /** Resumo estatístico opcional para inspeção humana. */
  summary?: {
    mean_pitch?: number;
    pitch_variance?: number;
    energy?: number;
    sample_rate?: number;
    duration_seconds?: number;
  };
}

/** Similaridade cosseno entre dois vetores. Retorna [0,1] (clamp). */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, (sim + 1) / 2));
}

/** Combina múltiplas amostras em um embedding médio (centroide). */
export function averageEmbeddings(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return [];
  const dim = embeddings[0].length;
  const out = new Array<number>(dim).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < dim && i < emb.length; i++) {
      out[i] += emb[i];
    }
  }
  return out.map((v) => v / embeddings.length);
}

/** Decide veredito de verificação baseado em similaridade vs baseline. */
export function verifyVerdict(similarity: number, baseline: number): {
  match: boolean;
  confidence: number;
  risk: 'low' | 'medium' | 'high';
} {
  const delta = similarity - baseline;
  const match = similarity >= baseline;
  const risk: 'low' | 'medium' | 'high' =
    similarity >= baseline + 0.05 ? 'low' :
    similarity >= baseline - 0.05 ? 'medium' : 'high';
  return {
    match,
    confidence: Math.round(similarity * 10000) / 100,
    risk,
  };
}

/** Padrões PT-BR para redação (CPF, cartão, CVV, CNH, RG simples). */
export const REDACTION_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'cpf', regex: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g },
  { name: 'cnpj', regex: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g },
  { name: 'credit_card', regex: /\b(?:\d[ -]?){13,19}\b/g },
  { name: 'cvv', regex: /\bcvv[:\s]*\d{3,4}\b/gi },
  { name: 'cep', regex: /\b\d{5}-?\d{3}\b/g },
  { name: 'phone_full', regex: /\b\(?\d{2}\)?[\s-]?9?\d{4}-?\d{4}\b/g },
];

export interface RedactionMatch {
  pattern: string;
  match: string;
  index: number;
  length: number;
}

/** Encontra todos os matches sensíveis em um texto (transcrição). */
export function findSensitiveMatches(text: string): RedactionMatch[] {
  const out: RedactionMatch[] = [];
  for (const { name, regex } of REDACTION_PATTERNS) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      out.push({ pattern: name, match: m[0], index: m.index, length: m[0].length });
      if (m.index === regex.lastIndex) regex.lastIndex++;
    }
  }
  return out;
}

/** Substitui matches por máscara preservando o tamanho. */
export function maskText(text: string, matches: RedactionMatch[]): string {
  if (matches.length === 0) return text;
  const sorted = [...matches].sort((a, b) => b.index - a.index);
  let out = text;
  for (const m of sorted) {
    const mask = '█'.repeat(m.length);
    out = out.slice(0, m.index) + mask + out.slice(m.index + m.length);
  }
  return out;
}
