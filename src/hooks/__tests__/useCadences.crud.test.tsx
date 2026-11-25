import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { toast } from 'sonner';
import { useCadences, useCadenceEnrollments } from '../useCadences';

interface QueryResult { data: unknown; error: { message: string } | null }

const rows: Record<string, unknown[]> = {
  cadences: [
    { id: 'c1', name: 'Cad A', description: 'd', is_active: true, version: 3, created_at: '', updated_at: '' },
    { id: 'c2', name: 'Cad B', description: null, is_active: false, version: 1, created_at: '', updated_at: '' },
  ],
  cadence_steps: [
    { id: 's1', cadence_id: 'c1', step_order: 1, step_type: 'call', delay_days: 0, delay_hours: 0, subject: null, body: null },
    { id: 's2', cadence_id: 'c1', step_order: 2, step_type: 'email', delay_days: 1, delay_hours: 0, subject: 'a', body: 'b' },
    { id: 's3', cadence_id: 'c1', step_order: 3, step_type: 'task', delay_days: 2, delay_hours: 0, subject: null, body: null },
  ],
  cadence_enrollments: [
    { id: 'e1', cadence_id: 'c1', contact_id: 'ct1', deal_id: null, agent_name: 'Ana', current_step: 0, status: 'active', next_action_at: '2026-11-25T10:00:00Z' },
  ],
};

let mutationResult: QueryResult = { data: null, error: null };
const updates: { table: string; payload: Record<string, unknown>; match: Record<string, unknown> }[] = [];
const deletes: { table: string; match: Record<string, unknown> }[] = [];

const makeQuery = (table: string) => {
  const match: Record<string, unknown> = {};
  let updatePayload: Record<string, unknown> | null = null;
  let isDelete = false;
  const q: Record<string, unknown> = {
    select: () => q,
    order: () => q,
    in: () => q,
    range: () => Promise.resolve({ data: rows[table] ?? [], error: null, count: (rows[table] ?? []).length }),
    update: (payload: Record<string, unknown>) => { updatePayload = payload; return q; },
    delete: () => { isDelete = true; return q; },
    eq: (col: string, val: unknown) => { match[col] = val; return q; },
    then: (resolve: (v: QueryResult) => unknown) => {
      let result: QueryResult;
      if (updatePayload) {
        updates.push({ table, payload: updatePayload, match: { ...match } });
        result = mutationResult;
      } else if (isDelete) {
        deletes.push({ table, match: { ...match } });
        result = mutationResult;
      } else {
        result = { data: rows[table] ?? [], error: null };
      }
      return Promise.resolve(result).then(resolve);
    },
  };
  return q;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn((table: string) => makeQuery(table)) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const loaded = async () => {
  const hook = renderHook(() => useCadences());
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
};

describe('useCadences: edicao e exclusao', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updates.length = 0;
    deletes.length = 0;
    mutationResult = { data: null, error: null };
  });

  it('updateCadence envia o patch junto com a version atual e recarrega', async () => {
    const { result } = await loaded();
    let ok = false;
    await act(async () => { ok = await result.current.updateCadence('c1', { name: 'Novo nome' }); });
    expect(ok).toBe(true);
    expect(updates).toEqual([
      { table: 'cadences', payload: { name: 'Novo nome', version: 3 }, match: { id: 'c1' } },
    ]);
    expect(toast.success).toHaveBeenCalled();
  });

  it('updateCadence alterna is_active mantendo a version do registro', async () => {
    const { result } = await loaded();
    await act(async () => { await result.current.updateCadence('c2', { is_active: true }); });
    expect(updates[0].payload).toEqual({ is_active: true, version: 1 });
    expect(updates[0].match).toEqual({ id: 'c2' });
  });

  it('updateCadence trata conflito de version recarregando a lista', async () => {
    const { result } = await loaded();
    mutationResult = { data: null, error: { message: 'OPTIMISTIC_LOCK_CONFLICT' } };
    let ok = true;
    await act(async () => { ok = await result.current.updateCadence('c1', { name: 'X' }); });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('outro usu'));
  });

  it('updateCadence devolve false em erro generico', async () => {
    const { result } = await loaded();
    mutationResult = { data: null, error: { message: 'boom' } };
    let ok = true;
    await act(async () => { ok = await result.current.updateCadence('c1', { name: 'X' }); });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it('deleteCadence remove a cadencia pelo id', async () => {
    const { result } = await loaded();
    let ok = false;
    await act(async () => { ok = await result.current.deleteCadence('c2'); });
    expect(ok).toBe(true);
    expect(deletes).toEqual([{ table: 'cadences', match: { id: 'c2' } }]);
  });

  it('deleteCadence devolve false quando o banco recusa', async () => {
    const { result } = await loaded();
    mutationResult = { data: null, error: { message: 'rls' } };
    let ok = true;
    await act(async () => { ok = await result.current.deleteCadence('c1'); });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it('updateStep aplica o patch no passo pelo id', async () => {
    const { result } = await loaded();
    let ok = false;
    await act(async () => { ok = await result.current.updateStep('s2', { delay_days: 5 }); });
    expect(ok).toBe(true);
    expect(updates).toEqual([
      { table: 'cadence_steps', payload: { delay_days: 5 }, match: { id: 's2' } },
    ]);
  });

  it('deleteStep renumera os passos restantes sem buraco na ordem', async () => {
    const { result } = await loaded();
    let ok = false;
    await act(async () => { ok = await result.current.deleteStep('s1'); });
    expect(ok).toBe(true);
    expect(deletes).toEqual([{ table: 'cadence_steps', match: { id: 's1' } }]);
    expect(updates).toEqual([
      { table: 'cadence_steps', payload: { step_order: 1 }, match: { id: 's2' } },
      { table: 'cadence_steps', payload: { step_order: 2 }, match: { id: 's3' } },
    ]);
  });
});
describe('useCadenceEnrollments: acompanhamento e status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updates.length = 0;
    mutationResult = { data: null, error: null };
  });

  it('carrega as inscricoes existentes', async () => {
    const { result } = renderHook(() => useCadenceEnrollments());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.enrollments).toHaveLength(1);
    expect(result.current.enrollments[0].status).toBe('active');
  });

  it('atualiza o status da inscricao pelo id e recarrega', async () => {
    const { result } = renderHook(() => useCadenceEnrollments());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.updateEnrollmentStatus('e1', 'paused'); });
    expect(ok).toBe(true);
    expect(updates).toContainEqual({ table: 'cadence_enrollments', payload: { status: 'paused' }, match: { id: 'e1' } });
  });

  it('devolve false e avisa quando o banco recusa a atualizacao', async () => {
    mutationResult = { data: null, error: { message: 'denied' } };
    const { result } = renderHook(() => useCadenceEnrollments());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.updateEnrollmentStatus('e1', 'cancelled'); });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });
});
