import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAdherence } from '../useAdherence';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: { date: '2026-01-01', adherence: { Alice: { scheduled_minutes: 480, actual_minutes: 470, adherence_percent: 98, deviations: [] } } },
        error: null,
      }),
    },
  },
}));

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

describe('useAdherence', () => {
  it('retorna dados de aderência', async () => {
    const { result } = renderHook(() => useAdherence('2026-01-01'), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.adherence.Alice.adherence_percent).toBe(98);
  });
});
