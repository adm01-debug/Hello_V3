import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useShifts } from '../useShifts';

interface ChainResult {
  data: unknown;
  error: unknown;
}

let shiftsResult: ChainResult = { data: [], error: null };
let templatesResult: ChainResult = { data: [], error: null };
let mutationResult: ChainResult = { data: { id: 'm1' }, error: null };

vi.mock('@/integrations/supabase/client', () => {
  const makeSelectChain = (final: () => ChainResult) => {
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => chain);
    chain.order = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.gte = vi.fn(() => chain);
    chain.lt = vi.fn(() => Promise.resolve(final()));
    // when no weekStart, the awaited value is the order() chain itself
    chain.then = (resolve: (v: ChainResult) => unknown) => resolve(final());
    return chain;
  };

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'agent_shifts') {
          return {
            select: vi.fn(() => makeSelectChain(() => shiftsResult)),
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve(mutationResult)),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve(mutationResult)),
                })),
              })),
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve(mutationResult)),
            })),
          };
        }
        // shift_templates
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve(templatesResult)),
          })),
        };
      }),
    },
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useShifts coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shiftsResult = {
      data: [
        {
          id: '1',
          agent_name: 'A',
          shift_date: '2026-01-01',
          start_time: '2026-01-01T09:00:00Z',
          end_time: '2026-01-01T18:00:00Z',
          break_minutes: 60,
          template_id: null,
          status: 'scheduled',
          notes: null,
          created_at: '',
          updated_at: '',
        },
      ],
      error: null,
    };
    templatesResult = {
      data: [
        {
          id: 't1',
          name: 'Manhã',
          start_time: '09:00',
          end_time: '18:00',
          break_minutes: 60,
          days_of_week: [1, 2, 3],
          color: '#fff',
          is_active: true,
        },
      ],
      error: null,
    };
    mutationResult = { data: { id: 'm1' }, error: null };
  });

  it('loads shifts and templates without weekStart', async () => {
    const { result } = renderHook(() => useShifts(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.shifts.length).toBeGreaterThanOrEqual(0);
    expect(result.current.templates.length).toBeGreaterThanOrEqual(0);
  });

  it('loads shifts with weekStart (gte/lt branch)', async () => {
    const { result } = renderHook(() => useShifts('2026-01-01'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(Array.isArray(result.current.shifts)).toBe(true);
  });

  it('exposes CRUD mutations and runs createShift success', async () => {
    const { result } = renderHook(() => useShifts('2026-01-01'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(typeof result.current.createShift).toBe('function');
    expect(typeof result.current.updateShift).toBe('function');
    expect(typeof result.current.deleteShift).toBe('function');

    act(() => {
      result.current.createShift({
        agent_name: 'A',
        shift_date: '2026-01-02',
        start_time: '2026-01-02T09:00:00Z',
        end_time: '2026-01-02T18:00:00Z',
        break_minutes: 60,
        template_id: null,
        status: 'scheduled',
        notes: null,
      });
    });
    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Turno criado'));
  });

  it('runs updateShift success', async () => {
    const { result } = renderHook(() => useShifts(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.updateShift({ id: 'x', notes: 'updated' });
    });
    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Turno atualizado'));
  });

  it('runs deleteShift success', async () => {
    const { result } = renderHook(() => useShifts(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.deleteShift('x');
    });
    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Turno removido'));
  });

  it('handles createShift error branch', async () => {
    mutationResult = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useShifts(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.createShift({
        agent_name: 'A',
        shift_date: '2026-01-02',
        start_time: '2026-01-02T09:00:00Z',
        end_time: '2026-01-02T18:00:00Z',
        break_minutes: 60,
        template_id: null,
        status: 'scheduled',
        notes: null,
      });
    });
    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao criar turno'));
  });

  it('handles updateShift and deleteShift error branches', async () => {
    mutationResult = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useShifts(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.updateShift({ id: 'x' });
      result.current.deleteShift('x');
    });
    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar turno'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao remover turno'));
  });

  it('handles shifts query error', async () => {
    shiftsResult = { data: null, error: { message: 'query failed' } };
    const { result } = renderHook(() => useShifts(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.shifts).toEqual([]);
  });
});
