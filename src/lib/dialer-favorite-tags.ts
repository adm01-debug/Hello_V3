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

/** Valor sentinela do filtro "todas as etiquetas". */
export const ALL_TAGS_FILTER = '__all__' as const;
/** Valor sentinela do filtro "sem etiqueta". */
export const UNTAGGED_FILTER = '__untagged__' as const;

export type TagFilter = string | typeof ALL_TAGS_FILTER | typeof UNTAGGED_FILTER;

/**
 * Filtra favoritos pela etiqueta selecionada, preservando a ordem original.
 *
 * Regras defensivas:
 * - filtro ausente/inválido ou `ALL_TAGS_FILTER` → devolve tudo;
 * - `UNTAGGED_FILTER` → apenas itens sem etiqueta válida;
 * - qualquer outro valor → comparação insensível a caixa/acento via `isSameTag`.
 */
export function filterFavoritesByTag<T extends TaggedItem>(
  items: readonly T[],
  filter: TagFilter | null | undefined,
): T[] {
  const safeItems = Array.isArray(items) ? items.filter((i) => i && typeof i === 'object') : [];
  if (typeof filter !== 'string' || filter === ALL_TAGS_FILTER) return safeItems;
  if (filter === UNTAGGED_FILTER) return safeItems.filter((i) => normalizeTag(i.tag) === null);
  const normalized = normalizeTag(filter);
  if (normalized === null) return safeItems;
  return safeItems.filter((i) => isSameTag(i.tag, normalized));
}

export interface TagFilterOption {
  value: TagFilter;
  label: string;
  count: number;
}

/**
 * Opções de filtro derivadas dos favoritos atuais (com contagens).
 * Só inclui "Sem etiqueta" quando existir ao menos um item nessa condição.
 */
export function buildTagFilterOptions<T extends TaggedItem>(items: readonly T[]): TagFilterOption[] {
  const groups = groupFavoritesByTag(items);
  const total = Array.isArray(items) ? items.filter((i) => i && typeof i === 'object').length : 0;
  const options: TagFilterOption[] = [{ value: ALL_TAGS_FILTER, label: 'Todos', count: total }];
  for (const group of groups) {
    options.push({
      value: group.tag ?? UNTAGGED_FILTER,
      label: group.label,
      count: group.items.length,
    });
  }
  return options;
}

/**
 * Garante que o filtro ativo continue existindo após alterações na lista.
 * Caso contrário, volta para "Todos" — evitando painel vazio sem explicação.
 */
export function resolveActiveFilter<T extends TaggedItem>(
  items: readonly T[],
  filter: TagFilter | null | undefined,
): TagFilter {
  if (typeof filter !== 'string' || filter === ALL_TAGS_FILTER) return ALL_TAGS_FILTER;
  const options = buildTagFilterOptions(items);
  const exists = options.some((option) =>
    option.value === filter ||
    (option.value !== ALL_TAGS_FILTER && option.value !== UNTAGGED_FILTER && isSameTag(option.value, filter)),
  );
  return exists ? filter : ALL_TAGS_FILTER;
}
