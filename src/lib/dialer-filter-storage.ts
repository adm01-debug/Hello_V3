/**
 * Persistência do filtro de etiquetas do discador.
 *
 * Lógica pura sobre um `Storage` injetável (default: `localStorage`), para que
 * a suíte de testes possa exercitar cenários adversos (quota estourada, JSON
 * corrompido, valores não textuais) sem depender do ambiente do navegador.
 *
 * A chave é escopada por usuário: em estações compartilhadas (hot desking) o
 * filtro de um agente nunca vaza para o próximo login.
 */

import { ALL_TAGS_FILTER, normalizeTag, UNTAGGED_FILTER, type TagFilter } from './dialer-favorite-tags';

const KEY_PREFIX = 'dialer:tag-filter:';
/** Escopo usado quando não há usuário autenticado conhecido. */
const ANONYMOUS_SCOPE = 'anon';

export interface FilterStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Chave determinística e estável para o escopo informado. */
export function buildFilterStorageKey(userId: unknown): string {
  const scope = typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : ANONYMOUS_SCOPE;
  return `${KEY_PREFIX}${scope}`;
}

/**
 * Converte um valor arbitrário em um `TagFilter` seguro.
 * Qualquer entrada inesperada degrada para "Todos" em vez de quebrar a UI.
 */
export function sanitizeStoredFilter(raw: unknown): TagFilter {
  if (typeof raw !== 'string') return ALL_TAGS_FILTER;
  if (raw === ALL_TAGS_FILTER || raw === UNTAGGED_FILTER) return raw;
  return normalizeTag(raw) ?? ALL_TAGS_FILTER;
}

function resolveStorage(storage?: FilterStorageLike | null): FilterStorageLike | null {
  if (storage) return storage;
  try {
    // `localStorage` pode lançar em contextos com cookies bloqueados.
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Lê o filtro salvo. Nunca lança: falha vira `ALL_TAGS_FILTER`. */
export function loadTagFilter(userId: unknown, storage?: FilterStorageLike | null): TagFilter {
  const store = resolveStorage(storage);
  if (!store) return ALL_TAGS_FILTER;
  try {
    return sanitizeStoredFilter(store.getItem(buildFilterStorageKey(userId)));
  } catch {
    return ALL_TAGS_FILTER;
  }
}

/**
 * Grava o filtro. "Todos" remove a chave (evita lixo em localStorage) e
 * retorna o valor efetivamente persistido para facilitar asserções em teste.
 */
export function saveTagFilter(
  userId: unknown,
  filter: unknown,
  storage?: FilterStorageLike | null,
): TagFilter {
  const sanitized = sanitizeStoredFilter(filter);
  const store = resolveStorage(storage);
  if (!store) return sanitized;
  const key = buildFilterStorageKey(userId);
  try {
    if (sanitized === ALL_TAGS_FILTER) store.removeItem(key);
    else store.setItem(key, sanitized);
  } catch {
    // Quota/modo privado: preferência é acessória, seguimos sem persistir.
  }
  return sanitized;
}
