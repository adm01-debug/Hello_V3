import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  ALL_TAGS_FILTER,
  UNTAGGED_FILTER,
  buildTagFilterOptions,
  filterFavoritesByTag,
  normalizeTag,
  resolveActiveFilter,
  isSameTag,
} from '@/lib/dialer-favorite-tags';

interface Fav {
  id: string;
  tag?: string | null;
}

const favArb = fc.record({
  id: fc.uuid(),
  tag: fc.oneof(
    fc.constant(null),
    fc.constant(undefined),
    fc.constant(''),
    fc.constantFrom('VIP', 'vip', 'Clientes', 'Suporte '),
    fc.string({ maxLength: 40 }),
  ),
}) as fc.Arbitrary<Fav>;

const listArb = fc.array(favArb, { maxLength: 30 });

describe('filtro rápido por etiqueta (PBT)', () => {
  it('"Todos" e filtros inválidos preservam a lista completa', () => {
    fc.assert(
      fc.property(listArb, (items) => {
        expect(filterFavoritesByTag(items, ALL_TAGS_FILTER)).toHaveLength(items.length);
        expect(filterFavoritesByTag(items, null)).toHaveLength(items.length);
        expect(filterFavoritesByTag(items, undefined)).toHaveLength(items.length);
        expect(filterFavoritesByTag(items, '   ')).toHaveLength(items.length);
      }),
      { numRuns: 400, seed: 42 },
    );
  });

  it('resultado é sempre subconjunto ordenado da lista original', () => {
    fc.assert(
      fc.property(listArb, fc.string({ maxLength: 30 }), (items, filter) => {
        const out = filterFavoritesByTag(items, filter);
        const ids = items.map((i) => i.id);
        const outIds = out.map((i) => i.id);
        let cursor = -1;
        for (const id of outIds) {
          const next = ids.indexOf(id, cursor + 1);
          expect(next).toBeGreaterThan(cursor);
          cursor = next;
        }
      }),
      { numRuns: 500, seed: 7 },
    );
  });

  it('filtro "sem etiqueta" devolve somente itens sem etiqueta válida', () => {
    fc.assert(
      fc.property(listArb, (items) => {
        const out = filterFavoritesByTag(items, UNTAGGED_FILTER);
        expect(out.every((i) => normalizeTag(i.tag) === null)).toBe(true);
      }),
      { numRuns: 400, seed: 11 },
    );
  });

  it('filtrar por uma etiqueta existente retorna apenas itens equivalentes', () => {
    fc.assert(
      fc.property(listArb, (items) => {
        for (const option of buildTagFilterOptions(items)) {
          if (option.value === ALL_TAGS_FILTER || option.value === UNTAGGED_FILTER) continue;
          const out = filterFavoritesByTag(items, option.value);
          expect(out).toHaveLength(option.count);
          expect(out.every((i) => isSameTag(i.tag, option.value))).toBe(true);
        }
      }),
      { numRuns: 300, seed: 3 },
    );
  });

  it('a soma das contagens por grupo é igual ao total', () => {
    fc.assert(
      fc.property(listArb, (items) => {
        const options = buildTagFilterOptions(items);
        const total = options[0];
        expect(total.value).toBe(ALL_TAGS_FILTER);
        const sum = options.slice(1).reduce((acc, o) => acc + o.count, 0);
        expect(sum).toBe(total.count);
        expect(total.count).toBe(items.length);
      }),
      { numRuns: 400, seed: 99 },
    );
  });

  it('filtro inexistente é reconciliado para "Todos"', () => {
    fc.assert(
      fc.property(listArb, (items) => {
        expect(resolveActiveFilter(items, 'etiqueta-que-nao-existe-xyz')).toBe(ALL_TAGS_FILTER);
        for (const option of buildTagFilterOptions(items)) {
          expect(resolveActiveFilter(items, option.value)).toBe(option.value);
        }
      }),
      { numRuns: 300, seed: 21 },
    );
  });
});
