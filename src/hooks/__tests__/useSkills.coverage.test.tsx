import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSkills } from '../useSkills';

interface QueryResult { data: unknown; error: unknown }
const responses: Record<string, QueryResult> = {
  skills: { data: [{ id: 's1', name: 'Sales', category: 'core', is_active: true }], error: null },
  agent_skills: { data: [{ id: 'a1', agent_name: 'Bob', skill_id: 's1', proficiency: 3 }], error: null },
};
let insertResult: QueryResult = { data: { id: 's2' }, error: null };
let upsertResult: QueryResult = { data: { id: 'a2' }, error: null };

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: vi.fn(function (this: unknown) {
        return {
          order: vi.fn(() => Promise.resolve(responses[table])),
          then: (res: (v: QueryResult) => unknown) => Promise.resolve(responses[table]).then(res),
          single: vi.fn(() => Promise.resolve(table === 'skills' ? insertResult : upsertResult)),
        };
      }),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve(insertResult)) })) })),
      upsert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve(upsertResult)) })) })),
    })),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useSkills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertResult = { data: { id: 's2' }, error: null };
    upsertResult = { data: { id: 'a2' }, error: null };
  });

  it('loads skills and agent skills, runs mutations', async () => {
    const { result } = renderHook(() => useSkills(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.skills.length).toBe(1);
    expect(result.current.agentSkills.length).toBe(1);

    await act(async () => { result.current.createSkill({ name: 'N', category: 'c', description: null, is_active: true }); });
    await act(async () => { result.current.upsertAgentSkill({ agent_name: 'Bob', skill_id: 's1', proficiency: 5 }); });
  });

  it('handles mutation errors', async () => {
    insertResult = { data: null, error: new Error('e') };
    upsertResult = { data: null, error: new Error('e') };
    const { result } = renderHook(() => useSkills(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { result.current.createSkill({ name: 'N', category: 'c', description: null, is_active: true }); });
    await act(async () => { result.current.upsertAgentSkill({ agent_name: 'B', skill_id: 's1', proficiency: 1 }); });
  });
});
