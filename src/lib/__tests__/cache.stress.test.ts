import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

/**
 * Stress test do React Query cache: garante que 10k entradas não estouram memória/CPU
 * e que invalidações em massa permanecem rápidas.
 */
describe('React Query cache — stress (10k entries)', () => {
  it('insere 10.000 entradas em < 2s', () => {
    const qc = new QueryClient();
    const start = performance.now();
    for (let i = 0; i < 10_000; i++) {
      qc.setQueryData(['stress', i], { id: i, value: `v-${i}` });
    }
    const elapsed = performance.now() - start;
    expect(qc.getQueryCache().getAll().length).toBe(10_000);
    expect(elapsed).toBeLessThan(2000);
  });

  it('invalidateQueries em filtro genérico < 500ms', async () => {
    const qc = new QueryClient();
    for (let i = 0; i < 10_000; i++) {
      qc.setQueryData(['stress', i], { id: i });
    }
    const start = performance.now();
    await qc.invalidateQueries({ queryKey: ['stress'] });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  it('clear() libera todas as entradas', () => {
    const qc = new QueryClient();
    for (let i = 0; i < 5000; i++) qc.setQueryData(['x', i], i);
    qc.clear();
    expect(qc.getQueryCache().getAll().length).toBe(0);
  });

  it('getQueryData retorna O(1) mesmo com cache cheio', () => {
    const qc = new QueryClient();
    for (let i = 0; i < 10_000; i++) qc.setQueryData(['k', i], i);
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      qc.getQueryData(['k', i * 10]);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
