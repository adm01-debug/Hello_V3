import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCoachingAssignments, type CoachingAssignment } from '../useCoachingAssignments';

interface ListBuilder {
  select: ReturnType<typeof vi.fn>;
  order: (...a: unknown[]) => Promise<{ data: unknown; error: unknown }>;
}
interface MutationBuilder {
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  single: () => Promise<{ data: unknown; error: unknown }>;
}

let listResult: { data: unknown; error: unknown } = { data: [], error: null };
let mutationResult: { data: unknown; error: unknown } = { data: { id: 'new' }, error: null };

function makeFrom() {
  const single = () => Promise.resolve(mutationResult);
  const mb: MutationBuilder = {
    insert: vi.fn(() => mb),
    update: vi.fn(() => mb),
    eq: vi.fn(() => mb),
    select: vi.fn(() => mb),
    single,
  };
  const lb: ListBuilder = {
    select: vi.fn(() => lb),
    order: () => Promise.resolve(listResult),
  };
  // Merge: select returns list-builder (with order) AND mutation-builder methods.
  return {
    select: vi.fn(() => ({ ...lb, ...mb, order: lb.order })),
    insert: mb.insert,
    update: mb.update,
  };
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => makeFrom()) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(), warn: vi.fn(), info: vi.fn(),
    create: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
  },
}));

import { toast } from 'sonner';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

const sample: CoachingAssignment[] = [
  { id: '1', agent_name: 'A', assigner_name: null, call_session_id: null, title: 'T', description: null, priority: 'high', due_at: null, status: 'pending', completed_at: null, agent_response: null, created_at: '2026-01-01' },
];

describe('useCoachingAssignments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listResult = { data: sample, error: null };
    mutationResult = { data: { id: 'new' }, error: null };
  });

  it('carrega assignments', async () => {
    const { result } = renderHook(() => useCoachingAssignments(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.assignments.length).toBe(1);
  });

  it('cria assignment com sucesso', async () => {
    const { result } = renderHook(() => useCoachingAssignments(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.create({ agent_name: 'A', title: 'T', description: null, priority: 'high', due_at: null, call_session_id: null });
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Coaching atribuído'));
  });

  it('completa assignment com sucesso', async () => {
    const { result } = renderHook(() => useCoachingAssignments(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.complete({ id: '1', agent_response: 'ok' });
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Coaching concluído'));
  });

  it('trata erro ao criar', async () => {
    mutationResult = { data: null, error: { message: 'fail' } };
    const { result } = renderHook(() => useCoachingAssignments(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.create({ agent_name: 'A', title: 'T', description: null, priority: 'low', due_at: null, call_session_id: null });
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao atribuir coaching'));
  });

  it('trata erro ao completar', async () => {
    mutationResult = { data: null, error: { message: 'fail' } };
    const { result } = renderHook(() => useCoachingAssignments(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.complete({ id: '1' });
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao concluir'));
  });
});
