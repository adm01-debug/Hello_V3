import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useChurnRisk } from '../useChurnRisk';

vi.mock('@/integrations/supabase/client', () => {
  const signals = [
    { id: 's1', account_id: 'a1', signal_type: 'contact_drop', severity: 'high', score_delta: 25, description: 'sem contato', evidence: {}, detected_at: '', resolved_at: null, resolved_by: null, resolution_notes: null, is_active: true },
  ];
  const makeBuilder = () => {
    const builder: Record<string, unknown> = {};
    const result = { data: signals, error: null };
    builder.select = vi.fn().mockReturnValue(builder);
    builder.update = vi.fn().mockReturnValue(builder);
    builder.eq = vi.fn().mockReturnValue(builder);
    builder.order = vi.fn().mockReturnValue(builder);
    builder.then = (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve);
    return builder;
  };
  return { supabase: { from: vi.fn(() => makeBuilder()) } };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('useChurnRisk', () => {
  it('loads active signals', async () => {
    const { result } = renderHook(() => useChurnRisk('a1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.signals.length).toBe(1);
    expect(result.current.signals[0].signal_type).toBe('contact_drop');
  });

  it('resolves a signal with notes', async () => {
    const { result } = renderHook(() => useChurnRisk('a1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.resolve('s1', 'Contato realizado'); });
    const { supabase } = await import('@/integrations/supabase/client');
    expect(supabase.from).toHaveBeenCalledWith('churn_risk_signals');
  });
});
