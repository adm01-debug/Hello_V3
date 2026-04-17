import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useShifts } from '../useShifts';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockResolvedValue({ data: [{ id: '1', agent_name: 'A', shift_date: '2026-01-01', start_time: '2026-01-01T09:00:00Z', end_time: '2026-01-01T18:00:00Z', break_minutes: 60, template_id: null, status: 'scheduled', notes: null, created_at: '', updated_at: '' }], error: null }),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: '2' }, error: null }) })) })),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    })),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useShifts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('carrega shifts da semana', async () => {
    const { result } = renderHook(() => useShifts('2026-01-01'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.shifts.length).toBeGreaterThanOrEqual(0);
  });

  it('expõe ações CRUD', () => {
    const { result } = renderHook(() => useShifts(), { wrapper });
    expect(typeof result.current.createShift).toBe('function');
    expect(typeof result.current.updateShift).toBe('function');
    expect(typeof result.current.deleteShift).toBe('function');
  });
});
