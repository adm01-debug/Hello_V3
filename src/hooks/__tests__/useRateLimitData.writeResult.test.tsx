import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRateLimitData } from '../useRateLimitData';

// A-065: RLS sem policy de UPDATE/DELETE devolve 0 linhas com error null. Sem
// conferir o count, a tela anunciava sucesso e nada era gravado.
const estado = vi.hoisted(() => ({
  update: { error: null as Error | null, count: 0 as number | null },
  delete: { error: null as Error | null, count: 0 as number | null },
  updateArgs: [] as unknown[],
  deleteArgs: [] as unknown[],
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => {
      const b: Record<string, unknown> = {};
      b.select = vi.fn(() => b);
      b.order = vi.fn(() => b);
      b.limit = vi.fn().mockResolvedValue({ data: [], error: null });
      b.update = vi.fn((...args: unknown[]) => {
        estado.updateArgs.push(args);
        return { eq: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve(estado.update)) })) };
      });
      b.delete = vi.fn((...args: unknown[]) => {
        estado.deleteArgs.push(args);
        return { lt: vi.fn(() => Promise.resolve(estado.delete)) };
      });
      return b;
    }),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

import { toast } from 'sonner';

describe('useRateLimitData — resultado real das escritas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    estado.update = { error: null, count: 0 };
    estado.delete = { error: null, count: 0 };
    estado.updateArgs = [];
    estado.deleteArgs = [];
  });

  // O mock devolve o count que o teste mandar; sem esta assercao, remover
  // { count: 'exact' } do hook nao quebraria nenhum caso — e no Supabase real o
  // count volta null, entao a tela voltaria a anunciar sucesso sem gravar.
  it('pede a contagem ao banco nas duas escritas', async () => {
    estado.update = { error: null, count: 1 };
    estado.delete = { error: null, count: 2 };
    const { result } = renderHook(() => useRateLimitData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.unblockIP('9.9.9.9'); });
    await act(async () => { await result.current.cleanOldLogs(); });

    expect(estado.updateArgs).toEqual([[{ is_blocked: false }, { count: 'exact' }]]);
    expect(estado.deleteArgs).toEqual([[{ count: 'exact' }]]);
  });

  it('unblockIP nao anuncia sucesso quando 0 linhas foram alteradas', async () => {
    const { result } = renderHook(() => useRateLimitData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.unblockIP('9.9.9.9'); });

    expect(toast.error).toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('unblockIP anuncia sucesso quando a linha foi alterada', async () => {
    estado.update = { error: null, count: 1 };
    const { result } = renderHook(() => useRateLimitData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.unblockIP('9.9.9.9'); });

    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('desbloqueado'));
  });

  it('cleanOldLogs informa quando nao havia log antigo', async () => {
    const { result } = renderHook(() => useRateLimitData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.cleanOldLogs(); });

    expect(toast.info).toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('cleanOldLogs informa quantos logs foram removidos', async () => {
    estado.delete = { error: null, count: 3 };
    const { result } = renderHook(() => useRateLimitData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.cleanOldLogs(); });

    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('3'));
  });
});
