import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

interface QueryResult {
  data: unknown;
  error: unknown;
}

const result: { current: QueryResult } = { current: { data: [], error: null } };

vi.mock('@/integrations/supabase/client', () => {
  const makeChain = () => {
    const c: Record<string, unknown> = {};
    ['select', 'order', 'gte', 'lte'].forEach((m) => {
      c[m] = vi.fn(() => c);
    });
    (c as { then: (r: (v: QueryResult) => void) => void }).then = (resolve) => resolve(result.current);
    return c;
  };
  return {
    supabase: {
      from: vi.fn(() => makeChain()),
    },
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

import { useAlertHistory } from '@/hooks/useAlertHistory';

const now = new Date().toISOString();

function makeAlert(over: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'a1',
    title: 'Title',
    message: 'Message',
    severity: 'info',
    alert_type: 'system',
    created_at: now,
    is_read: false,
    call_session_id: 'cs1',
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  result.current = { data: [], error: null };
});

describe('useAlertHistory', () => {
  it('loads with empty stats when there are no alerts', async () => {
    const { result: r } = renderHook(() => useAlertHistory());
    await waitFor(() => expect(r.current.loading).toBe(false));
    expect(r.current.stats).toEqual({ total: 0, critical: 0, warning: 0, info: 0, readRate: 0 });
    expect(r.current.alertTypes).toEqual([]);
    expect(r.current.dailyStats).toEqual([]);
    expect(r.current.filteredAlerts).toEqual([]);
  });

  it('computes severity counts, read rate, types and daily stats', async () => {
    result.current = {
      data: [
        makeAlert({ id: 'a1', severity: 'critical', alert_type: 'voip', is_read: true, title: 'Down' }),
        makeAlert({ id: 'a2', severity: 'warning', alert_type: 'voip', is_read: false, title: 'Slow' }),
        makeAlert({ id: 'a3', severity: 'info', alert_type: 'system', is_read: true, message: 'note' }),
      ],
      error: null,
    };
    const { result: r } = renderHook(() => useAlertHistory());
    await waitFor(() => expect(r.current.loading).toBe(false));

    expect(r.current.stats.total).toBe(3);
    expect(r.current.stats.critical).toBe(1);
    expect(r.current.stats.warning).toBe(1);
    expect(r.current.stats.info).toBe(1);
    expect(r.current.stats.readRate).toBeCloseTo((2 / 3) * 100);
    expect(r.current.alertTypes.sort()).toEqual(['system', 'voip']);
    expect(r.current.dailyStats[0].total).toBe(3);
  });

  it('applies search, severity and type filters', async () => {
    result.current = {
      data: [
        makeAlert({ id: 'a1', severity: 'critical', alert_type: 'voip', title: 'Outage detected', message: 'x' }),
        makeAlert({ id: 'a2', severity: 'warning', alert_type: 'system', title: 'Latency', message: 'spike here' }),
      ],
      error: null,
    };
    const { result: r } = renderHook(() => useAlertHistory());
    await waitFor(() => expect(r.current.loading).toBe(false));

    act(() => r.current.setSearchQuery('outage'));
    expect(r.current.filteredAlerts.map((a) => a.id)).toEqual(['a1']);

    act(() => r.current.setSearchQuery('spike'));
    expect(r.current.filteredAlerts.map((a) => a.id)).toEqual(['a2']);

    act(() => {
      r.current.setSearchQuery('');
      r.current.setSeverityFilter('critical');
    });
    expect(r.current.filteredAlerts.map((a) => a.id)).toEqual(['a1']);

    act(() => {
      r.current.setSeverityFilter('all');
      r.current.setTypeFilter('system');
    });
    expect(r.current.filteredAlerts.map((a) => a.id)).toEqual(['a2']);
  });

  it('refetches when the date range changes', async () => {
    const { result: r } = renderHook(() => useAlertHistory());
    await waitFor(() => expect(r.current.loading).toBe(false));

    await act(async () => {
      r.current.setDateRange({ from: new Date('2024-01-01'), to: new Date('2024-01-31') });
    });
    await waitFor(() => expect(r.current.loading).toBe(false));
    expect(r.current.dateRange.from.getFullYear()).toBe(2024);
  });

  it('handles a query error gracefully', async () => {
    result.current = { data: null, error: { message: 'boom' } };
    const { result: r } = renderHook(() => useAlertHistory());
    await waitFor(() => expect(r.current.loading).toBe(false));
    expect(r.current.alerts).toEqual([]);
    expect(r.current.stats.total).toBe(0);
  });

  it('exposes an imperative fetchAlerts callback', async () => {
    const { result: r } = renderHook(() => useAlertHistory());
    await waitFor(() => expect(r.current.loading).toBe(false));
    await act(async () => {
      await r.current.fetchAlerts();
    });
    expect(r.current.loading).toBe(false);
  });
});
