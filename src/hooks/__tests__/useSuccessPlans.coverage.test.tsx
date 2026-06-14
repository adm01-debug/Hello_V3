import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSuccessPlans } from '../useSuccessPlans';

const planRows = [
  {
    id: 'pl1',
    account_id: 'a1',
    title: 'Onboarding',
    objective: 'Adoption',
    business_outcome: null,
    start_date: '',
    target_date: '',
    completed_at: null,
    status: 'active',
    progress_percent: 50,
    owner_agent_name: null,
    stakeholders: [],
    metadata: {},
  },
];

const milestoneRows = [
  {
    id: 'm1',
    success_plan_id: 'pl1',
    title: 'Kickoff',
    description: null,
    due_date: null,
    completed_at: null,
    status: 'pending',
    display_order: 1,
    assigned_to: null,
  },
];

const state = {
  planError: null as unknown,
  insertError: null as unknown,
  updateError: null as unknown,
  emptyPlans: false,
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const builder: Record<string, unknown> = {};
      builder.select = vi.fn().mockReturnValue(builder);
      builder.eq = vi.fn();
      builder.in = vi.fn().mockReturnValue(builder);
      builder.insert = vi.fn().mockResolvedValue({ data: null, error: state.insertError });
      builder.update = vi.fn().mockReturnValue(builder);

      if (table === 'success_plans') {
        // order() is terminal for plans (when no accountId), eq() terminal when accountId
        const planResult = { data: state.emptyPlans ? [] : planRows, error: state.planError };
        builder.order = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue(planResult),
          then: (r: (v: unknown) => unknown) => Promise.resolve(planResult).then(r),
        });
      } else {
        // success_plan_milestones
        builder.order = vi.fn().mockResolvedValue({ data: milestoneRows, error: null });
        builder.eq = vi.fn().mockResolvedValue({ data: null, error: state.updateError });
      }
      return builder;
    }),
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/logger', () => {
  const mk = () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
  return { logger: { create: vi.fn(mk), ...mk() } };
});

beforeEach(() => {
  state.planError = null;
  state.insertError = null;
  state.updateError = null;
  state.emptyPlans = false;
});

describe('useSuccessPlans', () => {
  it('loads plans and milestones with accountId', async () => {
    const { result } = renderHook(() => useSuccessPlans('a1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.plans.length).toBe(1);
    expect(result.current.milestones['pl1']?.length).toBe(1);
  });

  it('loads plans without accountId', async () => {
    const { result } = renderHook(() => useSuccessPlans());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.plans.length).toBe(1);
  });

  it('handles empty plans (no milestone fetch)', async () => {
    state.emptyPlans = true;
    const { result } = renderHook(() => useSuccessPlans());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.plans.length).toBe(0);
    expect(result.current.milestones).toEqual({});
  });

  it('handles load error', async () => {
    state.planError = new Error('load fail');
    const { result } = renderHook(() => useSuccessPlans());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const { toast } = await import('sonner');
    expect(toast.error).toHaveBeenCalled();
  });

  it('createPlan success', async () => {
    const { result } = renderHook(() => useSuccessPlans());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.createPlan({ title: 'New plan' });
    });
    const { toast } = await import('sonner');
    expect(toast.success).toHaveBeenCalledWith('Plano criado');
  });

  it('createPlan error', async () => {
    const { result } = renderHook(() => useSuccessPlans());
    await waitFor(() => expect(result.current.loading).toBe(false));
    state.insertError = new Error('insert fail');
    await act(async () => {
      await result.current.createPlan({ title: 'X' });
    });
    const { toast } = await import('sonner');
    expect(toast.error).toHaveBeenCalledWith('Falha ao criar plano');
  });

  it('toggleMilestone completed and error', async () => {
    const { result } = renderHook(() => useSuccessPlans());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.toggleMilestone('m1', 'completed');
    });
    state.updateError = new Error('update fail');
    await act(async () => {
      await result.current.toggleMilestone('m1', 'pending');
    });
    const { toast } = await import('sonner');
    expect(toast.error).toHaveBeenCalledWith('Falha ao atualizar marco');
  });

  it('refresh re-loads', async () => {
    const { result } = renderHook(() => useSuccessPlans());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.plans.length).toBe(1);
  });
});
