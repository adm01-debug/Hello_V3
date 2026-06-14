import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useBlockedAccessLogs } from '../useBlockedAccessLogs';

type Result = { data: unknown[] | null; error: { message: string } | null };

const makeChain = (result: Result) => {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    order: vi.fn().mockResolvedValue(result),
  };
  return chain;
};

const sampleLogs = [
  {
    id: '1', ip_address: '1.2.3.4', reason: 'rate_limit', user_email: 'a@b.com',
    user_agent: 'UA', country: 'Brazil', city: 'SP', country_code: 'BR',
    created_at: new Date().toISOString(),
  },
  {
    id: '2', ip_address: '5.6.7.8', reason: 'rate_limit', user_email: null,
    user_agent: null, country: null, city: null, country_code: null,
    created_at: new Date().toISOString(),
  },
];

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => makeChain({ data: [], error: null })) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

describe('useBlockedAccessLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: sampleLogs, error: null }) as never);
  });

  it('fetches logs and processes stats', async () => {
    const { result } = renderHook(() => useBlockedAccessLogs());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.logs.length).toBe(2);
    expect(result.current.totalBlocks).toBe(2);
    expect(result.current.uniqueIPs).toBe(2);
    expect(result.current.uniqueCountries).toBe(1);
    expect(result.current.dailyStats.length).toBeGreaterThan(0);
    expect(result.current.reasonStats.length).toBeGreaterThan(0);
    expect(result.current.countryStats.length).toBeGreaterThan(0);
    expect(result.current.uniqueCountriesList).toContain('Brazil');
    expect(result.current.uniqueReasonsList).toContain('rate_limit');
  });

  it('handles fetch error', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeChain({ data: null, error: { message: 'db error' } }) as never
    );
    const { result } = renderHook(() => useBlockedAccessLogs());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(toast.error).toHaveBeenCalled();
  });

  it('filters logs by search, country, reason; clears filters', async () => {
    const { result } = renderHook(() => useBlockedAccessLogs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setSearchTerm('1.2.3.4'));
    await waitFor(() => expect(result.current.filteredLogs.length).toBe(1));
    expect(result.current.hasActiveFilters).toBeTruthy();

    act(() => { result.current.setSearchTerm(''); result.current.setCountryFilter('Brazil'); });
    await waitFor(() => expect(result.current.filteredLogs.length).toBe(1));

    act(() => { result.current.setCountryFilter('all'); result.current.setReasonFilter('rate_limit'); });
    await waitFor(() => expect(result.current.filteredLogs.length).toBe(2));

    act(() => result.current.clearFilters());
    await waitFor(() => expect(result.current.hasActiveFilters).toBeFalsy());
  });

  it('refetches when dateRange changes', async () => {
    const { result } = renderHook(() => useBlockedAccessLogs());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setDateRange('30'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(supabase.from).toHaveBeenCalledWith('blocked_access_logs');
  });
});
