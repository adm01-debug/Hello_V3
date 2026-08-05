import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAdherence } from '../useAdherence';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

describe('useAdherence', () => {
  beforeEach(() => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { date: '2026-01-01', adherence: { Alice: { scheduled_minutes: 480, actual_minutes: 470, adherence_percent: 98, deviations: [] } } },
      error: null,
    });
  });

  it('retorna dados de aderência', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client }, children);
    const { result } = renderHook(() => useAdherence('2026-01-01'), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.adherence.Alice.adherence_percent).toBe(98);
  });
});
