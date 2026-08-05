import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const invoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) } },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { useIPValidation } from '../useIPValidation';

describe('useIPValidation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns data on success', async () => {
    invoke.mockResolvedValueOnce({ data: { allowed: true }, error: null });
    const { result } = renderHook(() => useIPValidation());
    const res = await result.current.validateIP();
    expect(res).toEqual({ allowed: true });
    expect(invoke).toHaveBeenCalledWith('validate-ip', expect.objectContaining({ headers: expect.anything() }));
  });

  it('handles supabase error branch', async () => {
    invoke.mockResolvedValueOnce({ data: null, error: { message: 'blocked' } });
    const { result } = renderHook(() => useIPValidation());
    const res = await result.current.validateIP();
    expect(res).toEqual({ allowed: true, error: 'blocked' });
  });

  it('handles thrown exception branch', async () => {
    invoke.mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useIPValidation());
    const res = await result.current.validateIP();
    expect(res).toEqual({ allowed: true, error: 'Validation service unavailable' });
  });
});
