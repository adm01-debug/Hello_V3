import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useQualityAlerts } from '../useQualityAlerts';

interface QueryResult { data: unknown; error: unknown }
const responses: Record<string, QueryResult> = {
  call_quality_metrics: { data: [], error: null },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn(() => Promise.resolve(responses[table])),
    })),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useQualityAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    responses.call_quality_metrics = { data: [], error: null };
  });

  it('does not alert when there are no metrics', async () => {
    renderHook(() => useQualityAlerts(), { wrapper });
    await new Promise((r) => setTimeout(r, 50));
    expect(toast.error).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('does not alert when quality is good', async () => {
    responses.call_quality_metrics = {
      data: [{ id: 'q1', agent_name: 'A', mos_avg: 4.5, quality_label: 'good' }],
      error: null,
    };
    renderHook(() => useQualityAlerts(), { wrapper });
    await new Promise((r) => setTimeout(r, 50));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('alerts when quality_label is poor', async () => {
    responses.call_quality_metrics = {
      data: [{ id: 'q1', agent_name: 'Bob', mos_avg: 4.0, quality_label: 'poor' }],
      error: null,
    };
    renderHook(() => useQualityAlerts(), { wrapper });
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(logger.error).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      'Qualidade de Chamada Crítica',
      expect.objectContaining({ duration: 8000 }),
    );
  });

  it('alerts when mos_avg is below 3.0', async () => {
    responses.call_quality_metrics = {
      data: [{ id: 'q2', agent_name: 'Ana', mos_avg: 2.1, quality_label: 'fair' }],
      error: null,
    };
    renderHook(() => useQualityAlerts(), { wrapper });
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(logger.error).toHaveBeenCalled();
  });
});
