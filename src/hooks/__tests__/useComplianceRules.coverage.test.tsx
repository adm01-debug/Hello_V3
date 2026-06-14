import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useComplianceRules } from '../useComplianceRules';

let listError: unknown = null;
const upsertFn = vi.fn().mockResolvedValue({ error: null });
const updateEq = vi.fn().mockResolvedValue({ error: null });
const deleteEq = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn(() => Promise.resolve({ data: [{ id: 'r1', rule_name: 'R', severity: 'critical' }], error: listError })),
      upsert: (...a: unknown[]) => upsertFn(...a),
      update: vi.fn(() => ({ eq: (...a: unknown[]) => updateEq(...a) })),
      delete: vi.fn(() => ({ eq: (...a: unknown[]) => deleteEq(...a) })),
    })),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useComplianceRules', () => {
  beforeEach(() => { vi.clearAllMocks(); listError = null; });

  it('loads rules and runs mutations', async () => {
    const { result } = renderHook(() => useComplianceRules(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.rules.length).toBe(1);

    await act(async () => {
      result.current.upsert({ rule_name: 'X', rule_type: 'keyword', pattern: 'p', message: 'm' });
    });
    await waitFor(() => expect(upsertFn).toHaveBeenCalled());

    await act(async () => { result.current.toggleActive({ id: 'r1', is_active: false }); });
    await waitFor(() => expect(updateEq).toHaveBeenCalled());

    await act(async () => { result.current.remove('r1'); });
    await waitFor(() => expect(deleteEq).toHaveBeenCalled());
  });

  it('handles upsert error branch', async () => {
    upsertFn.mockResolvedValueOnce({ error: new Error('nope') });
    const { result } = renderHook(() => useComplianceRules(), { wrapper });
    await act(async () => { result.current.upsert({ rule_name: 'X', rule_type: 'k', pattern: 'p', message: 'm' }); });
    await waitFor(() => expect(upsertFn).toHaveBeenCalled());
  });
});
