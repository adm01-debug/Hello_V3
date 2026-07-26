/**
 * Lógica pura de ordenação dos favoritos do discador.
 *
 * Mantida fora dos componentes/hooks para permitir testes baseados em
 * propriedades (PBT) com milhares de cenários — incluindo entradas
 * corrompidas, índices fora do intervalo e posições duplicadas.
 */

export interface OrderableFavorite {
  id: string;
  position: number;
}

/**
 * Move um item de `from` para `to` retornando uma NOVA lista.
 * Índices inválidos (NaN, negativos, fora do intervalo) resultam na lista
 * original inalterada — nunca lança.
 */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const list = Array.isArray(items) ? [...items] : [];
  const isValid = (index: number) =>
    Number.isInteger(index) && index >= 0 && index < list.length;

  if (!isValid(from) || !isValid(to) || from === to) return list;

  const [moved] = list.splice(from, 1);
  list.splice(to, 0, moved);
  return list;
}

/**
 * Reatribui `position` sequencialmente (0..n-1) preservando a ordem do array.
 * Garante posições densas e únicas mesmo quando o banco tem lacunas ou empates.
 */
export function normalizePositions<T extends OrderableFavorite>(items: readonly T[]): T[] {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => ({ ...item, position: index }));
}

/**
 * Retorna apenas os itens cuja posição mudou em relação ao valor original —
 * evita escritas desnecessárias no banco durante o reordenamento.
 */
export function diffPositions<T extends OrderableFavorite>(
  original: readonly T[],
  reordered: readonly T[],
): Array<{ id: string; position: number }> {
  const previous = new Map<string, number>();
  for (const item of original ?? []) {
    if (item && typeof item.id === 'string') previous.set(item.id, item.position);
  }
  const changes: Array<{ id: string; position: number }> = [];
  (reordered ?? []).forEach((item, index) => {
    if (!item || typeof item.id !== 'string') return;
    if (previous.get(item.id) !== index) changes.push({ id: item.id, position: index });
  });
  return changes;
}

/** Reordena e normaliza em uma única operação (usada pela UI e pelo hook). */
export function reorderFavorites<T extends OrderableFavorite>(
  items: readonly T[],
  from: number,
  to: number,
): T[] {
  return normalizePositions(moveItem(items, from, to));
}
