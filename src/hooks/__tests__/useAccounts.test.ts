import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAccounts } from '../useAccounts';

vi.mock('@/integrations/supabase/client', () => {
  const account = {
    id: 'a1', name: 'Acme', segment: 'enterprise', mrr: 1000, arr: 12000,
    csm_agent_name: 'Maria', health_score: 75, health_factors: {},
    churn_risk_score: 20, current_stage: 'adoption', status: 'active',
    metadata: {}, created_at: '', updated_at: '',
    domain: null, contract_start_date: null, contract_end_date: null,
    last_contact_at: null, next_review_at: null, notes: null, tags: null,
  };
  const makeBuilder = () => {
    const builder: Record<string, unknown> = {};
    const result = { data: [account], error: null };
    const singleResult = { data: account, error: null };
    builder.select = vi.fn().mockReturnValue(builder);
    builder.insert = vi.fn().mockReturnValue(builder);
    builder.update = vi.fn().mockReturnValue(builder);
    builder.eq = vi.fn().mockReturnValue(builder);
    builder.order = vi.fn().mockReturnValue(builder);
    builder.single = vi.fn().mockResolvedValue(singleResult);
    builder.then = (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve);
    return builder;
  };
  return {
    supabase: {
      from: vi.fn(() => makeBuilder()),
      functions: { invoke: vi.fn().mockResolvedValue({ data: { health_score: 80 }, error: null }) },
    },
  };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('useAccounts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads accounts on mount', async () => {
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.accounts.length).toBe(1);
    expect(result.current.accounts[0].name).toBe('Acme');
  });

  it('recomputes health via edge function', async () => {
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.recomputeHealth('a1'); });
    const { supabase } = await import('@/integrations/supabase/client');
    expect(supabase.functions.invoke).toHaveBeenCalledWith('compute-account-health', { body: { account_id: 'a1' } });
  });

  it('triggers churn detection', async () => {
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.detectChurn('a1'); });
    const { supabase } = await import('@/integrations/supabase/client');
    expect(supabase.functions.invoke).toHaveBeenCalledWith('detect-churn-risk', { body: { account_id: 'a1' } });
  });
});
