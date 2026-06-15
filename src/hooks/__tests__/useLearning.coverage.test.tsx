import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLearning } from '../useLearning';

const state = {
  modulesError: null as unknown,
  completionsError: null as unknown,
  upsertError: null as unknown,
};

const moduleRow = {
  id: 'm1', title: 'Intro', description: null, content_type: 'video', content_url: null,
  content_body: null, duration_minutes: 10, category: 'sales', difficulty: 'easy', tags: null, is_active: true,
};
const completionRow = { id: 'c1', agent_name: 'Ana', module_id: 'm1', completed_at: '', score: 90 };

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const builder: Record<string, unknown> = {};
      builder.select = vi.fn(() => builder);
      builder.eq = vi.fn(() => builder);
      builder.upsert = vi.fn(() => builder);
      builder.order = vi.fn(() =>
        Promise.resolve({ data: [moduleRow], error: state.modulesError })
      );
      builder.single = vi.fn(() => Promise.resolve({ data: completionRow, error: state.upsertError }));
      (builder as { then: (r: (v: unknown) => void) => void }).then = (resolve) =>
        resolve({ data: [completionRow], error: state.completionsError });
      return builder;
    }),
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/logger', () => {
  const mk = () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
  return { logger: { create: vi.fn(mk), ...mk() } };
});

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  state.modulesError = null;
  state.completionsError = null;
  state.upsertError = null;
  vi.clearAllMocks();
});

describe('useLearning', () => {
  it('loads modules and completions', async () => {
    const { result } = renderHook(() => useLearning(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(result.current.modules.length).toBe(1));
    await waitFor(() => expect(result.current.completions.length).toBe(1));
  });

  it('markComplete success shows toast', async () => {
    const { result } = renderHook(() => useLearning(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      result.current.markComplete({ agent_name: 'Ana', module_id: 'm1', score: 80 });
    });
    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Módulo concluído!'));
  });

  it('markComplete error shows toast', async () => {
    state.upsertError = new Error('upsert fail');
    const { result } = renderHook(() => useLearning(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      result.current.markComplete({ agent_name: 'Ana', module_id: 'm1' });
    });
    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao registrar conclusão'));
  });

  it('handles query errors', async () => {
    state.modulesError = new Error('mod fail');
    state.completionsError = new Error('comp fail');
    const { result } = renderHook(() => useLearning(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.modules).toEqual([]);
    expect(result.current.completions).toEqual([]);
  });
});
