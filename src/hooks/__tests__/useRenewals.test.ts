import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRenewals } from '../useRenewals';

vi.mock('@/integrations/supabase/client', () => {
  const now = Date.now();
  const renewals = [
    { id: 'r1', status: 'open', due_date: new Date(now + 10 * 86400000).toISOString().slice(0, 10), proposed_value: 1000, probability: 80, current_value: 800, renewal_type: 'renewal', closed_at: null, owner_agent_name: 'M', notes: null, loss_reason: null, metadata: {}, account_id: 'a1', created_at: '', updated_at: '' },
    { id: 'r2', status: 'in_negotiation', due_date: new Date(now + 50 * 86400000).toISOString().slice(0, 10), proposed_value: 2000, probability: 40, current_value: 0, renewal_type: 'expansion', closed_at: null, owner_agent_name: 'M', notes: null, loss_reason: null, metadata: {}, account_id: 'a1', created_at: '', updated_at: '' },
    { id: 'r3', status: 'won', due_date: new Date(now - 10 * 86400000).toISOString().slice(0, 10), proposed_value: 500, probability: 100, current_value: 500, renewal_type: 'renewal', closed_at: '', owner_agent_name: 'M', notes: null, loss_reason: null, metadata: {}, account_id: 'a1', created_at: '', updated_at: '' },
  ];
  const makeBuilder = () => {
    const builder: Record<string, unknown> = {};
    const result = { data: renewals, error: null };
    builder.select = vi.fn().mockReturnValue(builder);
    builder.order = vi.fn().mockReturnValue(builder);
    builder.eq = vi.fn().mockReturnValue(builder);
    builder.then = (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve);
    return builder;
  };
  return { supabase: { from: vi.fn(() => makeBuilder()) } };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('useRenewals', () => {
  it('classifies renewals into 30/60/90 buckets', async () => {
    const { result } = renderHook(() => useRenewals());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.buckets.d30.map((r) => r.id)).toEqual(['r1']);
    expect(result.current.buckets.d60.map((r) => r.id)).toEqual(['r2']);
  });

  it('computes weighted and pipeline totals', async () => {
    const { result } = renderHook(() => useRenewals());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.totals.pipeline_value).toBe(3000);
    expect(result.current.totals.weighted_value).toBe(1000 * 0.8 + 2000 * 0.4);
    expect(result.current.totals.won_value).toBe(500);
  });
});
