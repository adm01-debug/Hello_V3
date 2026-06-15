import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAgentRanking } from '../useAgentRanking';

interface TableResult {
  data: unknown;
  error: unknown;
}

// Per-table result registry keyed by table name. Plain awaits use `list`
// results; .single()/.maybeSingle() use `single` results.
const tableResults: Record<string, TableResult> = {};
const singleResults: Record<string, TableResult> = {};
function setTable(name: string, data: unknown, error: unknown = null) {
  tableResults[name] = { data, error };
}
function setSingle(name: string, data: unknown, error: unknown = null) {
  singleResults[name] = { data, error };
}

// Builds a chainable query object whose terminal awaits resolve to the
// registered result for the table.
function makeBuilder(table: string) {
  const listResult = (): TableResult => tableResults[table] ?? { data: null, error: null };
  const singleResult = (): TableResult => {
    if (singleResults[table]) return singleResults[table];
    const r = listResult();
    const d = Array.isArray(r.data) ? (r.data[0] ?? null) : r.data;
    return { data: d, error: r.error };
  };

  const builder: Record<string, unknown> = {};
  const chain = ['select', 'eq', 'order', 'gte', 'lt', 'in', 'limit', 'insert', 'update', 'delete', 'upsert'];
  for (const m of chain) {
    builder[m] = vi.fn(() => builder);
  }
  builder.maybeSingle = vi.fn(() => Promise.resolve(singleResult()));
  builder.single = vi.fn(() => Promise.resolve(singleResult()));
  // Make the builder itself awaitable (terminal without single)
  builder.then = (resolve: (v: TableResult) => unknown) => resolve(listResult());
  return builder;
}

const fromMock = vi.fn((table: string) => makeBuilder(table));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...a: unknown[]) => fromMock(...(a as [string])),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/lib/logger', () => {
  const shape = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return { logger: { ...shape, create: () => shape } };
});

import { toast } from 'sonner';

describe('useAgentRanking (coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(tableResults)) delete tableResults[k];
    for (const k of Object.keys(singleResults)) delete singleResults[k];
    // Sensible defaults so the mount-time fetches succeed
    setTable('call_sessions', [
      { agent_name: 'Alice', duration_seconds: 120, status: 'completed', id: 's1', created_at: new Date().toISOString() },
      { agent_name: 'Bob', duration_seconds: 60, status: 'missed', id: 's2', created_at: new Date().toISOString() },
    ]);
    setTable('call_summaries', [
      { call_session_id: 's1', customer_satisfaction: 9, agent_performance_score: 8 },
    ]);
    setTable('agent_goals', [
      { agent_name: 'Alice', calls_target: 1, satisfaction_target: 1, performance_target: 1 },
    ]);
    setTable('call_alerts', null);
    setTable('call_analyses', null);
  });

  it('fetches agent stats on mount and exposes data', async () => {
    const { result } = renderHook(() => useAgentRanking());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.agents.length).toBeGreaterThan(0);
    expect(result.current.performanceData.length).toBeGreaterThan(0);
  });

  it('getGoalsForAgent returns saved goals and default fallback', async () => {
    const { result } = renderHook(() => useAgentRanking());
    await waitFor(() => expect(result.current.agents.length).toBeGreaterThan(0));
    const known = result.current.getGoalsForAgent('Alice');
    expect(known.calls_target).toBe(1);
    const unknown = result.current.getGoalsForAgent('Nobody');
    expect(unknown.calls_target).toBe(50);
  });

  it('checkGoalAchievements fires success toast when goals met', async () => {
    const { result } = renderHook(() => useAgentRanking());
    await waitFor(() => expect(result.current.agents.length).toBeGreaterThan(0));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('changes sortBy across all branches', async () => {
    const { result } = renderHook(() => useAgentRanking());
    await waitFor(() => expect(result.current.agents.length).toBeGreaterThan(0));
    for (const s of ['calls', 'satisfaction', 'performance', 'score']) {
      act(() => result.current.setSortBy(s));
      await waitFor(() => expect(result.current.sortBy).toBe(s));
    }
  });

  it('changes period to hit gte branch (today/week/month)', async () => {
    const { result } = renderHook(() => useAgentRanking());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    for (const p of ['today', 'week', 'month', 'all']) {
      act(() => result.current.setPeriod(p));
      await waitFor(() => expect(result.current.period).toBe(p));
    }
  });

  it('saveGoals does nothing without editingGoals, then saves successfully', async () => {
    const { result } = renderHook(() => useAgentRanking());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.saveGoals(); });
    expect(toast.success).not.toHaveBeenCalledWith('Metas salvas com sucesso!');

    act(() => result.current.setEditingGoals({
      agent_name: 'Alice', calls_target: 10, satisfaction_target: 5, performance_target: 5,
    }));
    await waitFor(() => expect(result.current.editingGoals).not.toBeNull());

    await act(async () => { await result.current.saveGoals(); });
    expect(toast.success).toHaveBeenCalledWith('Metas salvas com sucesso!');
    await waitFor(() => expect(result.current.goalsDialogOpen).toBe(false));
  });

  it('saveGoals handles error from upsert', async () => {
    const { result } = renderHook(() => useAgentRanking());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.setEditingGoals({
      agent_name: 'Alice', calls_target: 10, satisfaction_target: 5, performance_target: 5,
    }));
    await waitFor(() => expect(result.current.editingGoals).not.toBeNull());
    setTable('agent_goals', null, { message: 'fail' });
    await act(async () => { await result.current.saveGoals(); });
    expect(toast.error).toHaveBeenCalledWith('Erro ao salvar metas');
  });

  it('fetchAgentStats handles sessions error', async () => {
    setTable('call_sessions', null, { message: 'boom' });
    const { result } = renderHook(() => useAgentRanking());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(toast.error).toHaveBeenCalledWith('Erro ao carregar dados dos agentes');
  });

  it('createTestData inserts rows and toasts success', async () => {
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    setSingle('call_sessions', { id: 'new-session' });
    const { result } = renderHook(() => useAgentRanking());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.createTestData(); });
    expect(toast.success).toHaveBeenCalledWith('Dados de teste criados com sucesso!');
    rnd.mockRestore();
  });

  it('createTestData handles session insert error (continue branch)', async () => {
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    setSingle('call_sessions', null, { message: 'insert failed' });
    const { result } = renderHook(() => useAgentRanking());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.createTestData(); });
    rnd.mockRestore();
  });
});
