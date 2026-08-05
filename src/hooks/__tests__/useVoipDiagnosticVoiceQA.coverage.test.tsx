import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const invoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) } },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { useVoipDiagnosticVoiceQA } from '../useVoipDiagnosticVoiceQA';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useVoipDiagnosticVoiceQA', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves answer on success (default period)', async () => {
    invoke.mockResolvedValueOnce({ data: { answer: 'ok', citations: [], confidence: 'high', contextSize: 1, requestId: 'r' }, error: null });
    const { result } = renderHook(() => useVoipDiagnosticVoiceQA(), { wrapper });
    result.current.mutate({ question: 'why?' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.answer).toBe('ok');
    expect(invoke).toHaveBeenCalledWith('voip-diagnostic-voice-qa', expect.objectContaining({ body: { question: 'why?', period: 'week' } }));
  });

  it('passes explicit period', async () => {
    invoke.mockResolvedValueOnce({ data: { answer: 'x', citations: [], confidence: 'low', contextSize: 0, requestId: 'r2' }, error: null });
    const { result } = renderHook(() => useVoipDiagnosticVoiceQA(), { wrapper });
    result.current.mutate({ question: 'q', period: 'day' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invoke).toHaveBeenCalledWith('voip-diagnostic-voice-qa', expect.objectContaining({ body: { question: 'q', period: 'day' } }));
  });

  it('throws on error branch', async () => {
    invoke.mockResolvedValueOnce({ data: null, error: new Error('fail') });
    const { result } = renderHook(() => useVoipDiagnosticVoiceQA(), { wrapper });
    result.current.mutate({ question: 'bad' });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
