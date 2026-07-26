/**
 * Etiquetas (grupos) dos favoritos do discador.
 *
 * Lógica pura e defensiva: o banco impõe `char_length(btrim(tag)) BETWEEN 1 AND 24`
 * e `tag = btrim(tag)`, então a normalização aqui é a mesma regra aplicada antes
 * de qualquer escrita — evitando erro 23514 (violação de CHECK) no cliente.
 */

/** Limite de caracteres imposto pelo CHECK da coluna `tag`. */
export const MAX_TAG_LENGTH = 24;

/** Sugestões prontas exibidas na UI. Usuário pode ignorá-las. */
export const TAG_PRESETS: readonly string[] = [
  'VIP',
  'Clientes',
  'Prospects',
  'Suporte',
  'Interno',
] as const;

/** Rótulo do grupo sem etiqueta. */
export const UNTAGGED_LABEL = 'Sem etiqueta';

export interface TaggedItem {
  tag?: string | null;
}

export interface FavoriteGroup<T extends TaggedItem> {
  /** `null` representa o grupo dos favoritos sem etiqueta. */
  tag: string | null;
  label: string;
  items: T[];
}

/**
 * Normaliza uma etiqueta para o formato aceito pelo banco.
 * Retorna `null` quando a entrada é vazia, inválida ou não textual.
 */
export function normalizeTag(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  // Colapsa qualquer espaçamento (inclui \t, \n e NBSP) em espaço simples.
  const collapsed = input.replace(/\s+/g, ' ').trim();
  if (collapsed.length === 0) return null;
  const clipped = collapsed.slice(0, MAX_TAG_LENGTH).trim();
  return clipped.length === 0 ? null : clipped;
}

/** Duas etiquetas são o mesmo grupo se coincidem sem diferenciar maiúsculas. */
export function isSameTag(a: unknown, b: unknown): boolean {
  const na = normalizeTag(a);
  const nb = normalizeTag(b);
  if (na === null || nb === null) return na === nb;
  return na.localeCompare(nb, 'pt-BR', { sensitivity: 'base' }) === 0;
}

/**
 * Agrupa favoritos por etiqueta preservando a ordem original dentro de cada
 * grupo. Grupos etiquetados vêm primeiro (ordem alfabética PT-BR) e o grupo
 * sem etiqueta sempre por último.
 */
export function groupFavoritesByTag<T extends TaggedItem>(items: readonly T[]): Array<FavoriteGroup<T>> {
  const safeItems = Array.isArray(items) ? items : [];
  const buckets = new Map<string, FavoriteGroup<T>>();
  const untagged: T[] = [];

  for (const item of safeItems) {
    if (!item || typeof item !== 'object') continue;
    const tag = normalizeTag(item.tag);
    if (tag === null) {
      untagged.push(item);
      continue;
    }
    // Chave insensível a maiúsculas para não fragmentar "VIP" e "vip".
    const key = tag.toLocaleLowerCase('pt-BR');
    const existing = buckets.get(key);
    if (existing) existing.items.push(item);
    else buckets.set(key, { tag, label: tag, items: [item] });
  }

  const groups = Array.from(buckets.values()).sort((a, b) =>
    a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }),
  );

  if (untagged.length > 0) {
    groups.push({ tag: null, label: UNTAGGED_LABEL, items: untagged });
  }
  return groups;
}

/** Etiquetas já utilizadas pelo usuário, unidas às sugestões padrão. */
export function collectTagOptions(items: readonly TaggedItem[]): string[] {
  const seen = new Map<string, string>();
  for (const preset of TAG_PRESETS) {
    seen.set(preset.toLocaleLowerCase('pt-BR'), preset);
  }
  for (const item of Array.isArray(items) ? items : []) {
    const tag = normalizeTag(item?.tag);
    if (tag) seen.set(tag.toLocaleLowerCase('pt-BR'), tag);
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
  );
}
