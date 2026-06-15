import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useForecastVolume } from '../useForecastVolume';

const invoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) } },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useForecastVolume', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns forecast on success', async () => {
    invoke.mockResolvedValue({
      data: { forecast: [{ day_of_week: 1, hour: 9, expected_calls: 10, required_agents: 2 }], summary: { total_calls_28d: 100, avg_daily: 5, peak_hour: { day_of_week: 1, hour: 9, expected_calls: 10, required_agents: 2 }, total_required_agent_hours: 40 } },
      error: null,
    });
    const { result } = renderHook(() => useForecastVolume(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.forecast.length).toBe(1);
    expect(result.current.data?.summary.avg_daily).toBe(5);
  });

  it('errors when invoke returns error', async () => {
    invoke.mockResolvedValue({ data: null, error: new Error('fail') });
    const { result } = renderHook(() => useForecastVolume(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
