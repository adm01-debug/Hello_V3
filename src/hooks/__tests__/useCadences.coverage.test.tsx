import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCadences, useCadenceEnrollments } from '../useCadences';

interface QueryResult { data: unknown; error: unknown }
const responses: Record<string, QueryResult> = {
  cadences: { data: [{ id: 'c1', name: 'C', is_active: true }], error: null },
  cadence_steps: { data: [{ id: 's1', cadence_id: 'c1', step_order: 1, step_type: 'call', delay_days: 0, delay_hours: 0 }], error: null },
  cadence_enrollments: { data: [{ id: 'e1', cadence_id: 'c1', status: 'active' }], error: null },
};
let insertResult: QueryResult = { data: { id: 'new' }, error: null };

const makeQuery = (table: string) => {
  const q: Record<string, unknown> = {
    select: vi.fn(() => q),
    order: vi.fn(() => (table === 'cadence_enrollments' ? q : Promise.resolve(responses[table]))),
    eq: vi.fn(() => q),
    insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve(insertResult)) })) })),
    then: (res: (v: QueryResult) => unknown) => Promise.resolve(responses[table]).then(res),
  };
  return q;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn((table: string) => makeQuery(table)) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

describe('useCadences', () => {
  beforeEach(() => { vi.clearAllMocks(); insertResult = { data: { id: 'new' }, error: null }; });

  it('loads cadences and steps, creates and enrolls', async () => {
    const { result } = renderHook(() => useCadences());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cadences.length).toBe(1);
    expect(result.current.steps.length).toBe(1);

    await act(async () => { await result.current.createCadence('New', 'desc'); });
    await act(async () => { await result.current.addStep({ cadence_id: 'c1', step_order: 2, step_type: 'email', delay_days: 1, delay_hours: 0, subject: 's', body: 'b' }); });
    await act(async () => { await result.current.enrollContact('c1', 'ct1', 'Bob'); });
  });

  it('handles create/add/enroll errors', async () => {
    insertResult = { data: null, error: new Error('fail') };
    const { result } = renderHook(() => useCadences());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let created: unknown;
    await act(async () => { created = await result.current.createCadence('X'); });
    expect(created).toBeNull();
  });
});

describe('useCadenceEnrollments', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('loads enrollments without agent filter', async () => {
    const { result } = renderHook(() => useCadenceEnrollments());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.enrollments.length).toBe(1);
  });

  it('loads enrollments with agent filter', async () => {
    const { result } = renderHook(() => useCadenceEnrollments('Bob'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.enrollments.length).toBe(1);
  });
});
