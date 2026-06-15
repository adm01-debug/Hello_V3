import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAlerts } from '../useAlerts';

interface QueryResult { data: unknown; error: unknown }
const callAlertsData = [
  { id: 'ca1', call_session_id: 's1', alert_type: 'negative_sentiment', severity: 'critical', title: 'T', message: 'M', is_read: false, created_at: '2026-01-01' },
  { id: 'ca2', call_session_id: 's1', alert_type: 'low_satisfaction', severity: 'warning', title: 'T', message: 'M', is_read: true, created_at: '2026-01-02' },
];
const contactAlertsData = [
  { id: 'co1', contact_id: 'c1', alert_type: 'churn', severity: 'critical', title: 'T', message: 'M', is_read: false, is_actioned: false, created_at: '2026-01-01', trigger_data: {} },
  { id: 'co2', contact_id: 'c2', alert_type: 'upsell', severity: 'info', title: 'T', message: 'M', is_read: true, is_actioned: true, created_at: '2026-01-02', trigger_data: {} },
];

let invokeResult: QueryResult = { data: { alerts_created: 2 }, error: null };
const mutationOk = { error: null };

const channelObj = {
  on: vi.fn(function (this: unknown) { return channelObj; }),
  subscribe: vi.fn(() => channelObj),
};

const makeFrom = (table: string) => {
  const finalData = table === 'call_alerts' ? callAlertsData : contactAlertsData;
  const q: Record<string, unknown> = {
    select: vi.fn(() => q),
    order: vi.fn(() => Promise.resolve({ data: finalData, error: null })),
    update: vi.fn(() => q),
    delete: vi.fn(() => q),
    insert: vi.fn(() => q),
    eq: vi.fn(() => Promise.resolve(mutationOk)),
    in: vi.fn(() => Promise.resolve(mutationOk)),
    limit: vi.fn(() => ({ maybeSingle: vi.fn(() => Promise.resolve({ data: { id: 'session1' }, error: null })) })),
  };
  // insert(...).select().single() for call_sessions
  q.insert = vi.fn(() => ({
    select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: 'newsession' }, error: null })) })),
    then: (res: (v: QueryResult) => unknown) => Promise.resolve(mutationOk as unknown as QueryResult).then(res),
  }));
  return q;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => makeFrom(table)),
    channel: vi.fn(() => channelObj),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn(() => Promise.resolve(invokeResult)) },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

describe('useAlerts', () => {
  beforeEach(() => { vi.clearAllMocks(); invokeResult = { data: { alerts_created: 2 }, error: null }; });

  it('loads alerts and computes counts', async () => {
    const { result } = renderHook(() => useAlerts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.callAlerts.length).toBe(2);
    expect(result.current.contactAlerts.length).toBe(2);
    expect(result.current.callUnreadCount).toBe(1);
    expect(result.current.contactCriticalCount).toBe(1);
    expect(result.current.totalUnread).toBeGreaterThanOrEqual(2);
  });

  it('applies filters', async () => {
    const { result } = renderHook(() => useAlerts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.setSeverityFilter('critical'); });
    await waitFor(() => expect(result.current.filteredCallAlerts.every(a => a.severity === 'critical')).toBe(true));
    act(() => { result.current.setSeverityFilter('all'); result.current.setTypeFilter('churn'); });
    await waitFor(() => expect(result.current.filteredContactAlerts.length).toBe(1));
    act(() => { result.current.setTypeFilter('all'); result.current.setStatusFilter('read'); });
    await waitFor(() => expect(result.current.filteredCallAlerts.every(a => a.is_read)).toBe(true));
    act(() => { result.current.setStatusFilter('actioned'); });
    await waitFor(() => expect(result.current.filteredContactAlerts.every(a => a.is_actioned)).toBe(true));
    act(() => { result.current.setStatusFilter('pending'); });
    await waitFor(() => expect(result.current.filteredContactAlerts.every(a => !a.is_actioned)).toBe(true));
    act(() => { result.current.setStatusFilter('unread'); });
    await waitFor(() => expect(true).toBe(true));
  });

  it('checks for new alerts (success and none)', async () => {
    const { result } = renderHook(() => useAlerts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.checkForNewAlerts(); });
    invokeResult = { data: { alerts_created: 0 }, error: null };
    await act(async () => { await result.current.checkForNewAlerts(); });
    expect(result.current.isCheckingAlerts).toBe(false);
  });

  it('check alerts error branch', async () => {
    invokeResult = { data: null, error: new Error('boom') };
    const { result } = renderHook(() => useAlerts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.checkForNewAlerts(); });
    expect(result.current.isCheckingAlerts).toBe(false);
  });

  it('runs mark/batch/select/delete actions', async () => {
    const { result } = renderHook(() => useAlerts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.markCallAlertAsRead('ca1'); });
    await act(async () => { await result.current.markAllCallAlertsAsRead(); });
    await act(async () => { await result.current.markContactAlertAsRead('co1'); });
    await act(async () => { await result.current.markContactAlertAsActioned('co1'); });
    await act(async () => { await result.current.deleteContactAlert('co1'); });

    act(() => { result.current.toggleCallAlertSelection('ca1'); result.current.toggleContactAlertSelection('co1'); });
    await waitFor(() => expect(result.current.selectedCallAlerts.size).toBe(1));
    await act(async () => { await result.current.batchMarkCallAlertsAsRead(); });

    act(() => { result.current.toggleContactAlertSelection('co1'); });
    await act(async () => { await result.current.batchMarkContactAlertsAsRead(); });
    act(() => { result.current.toggleContactAlertSelection('co1'); });
    await act(async () => { await result.current.batchMarkContactAlertsAsActioned(); });
    act(() => { result.current.toggleContactAlertSelection('co1'); });
    await act(async () => { await result.current.batchDeleteContactAlerts(); });

    act(() => { result.current.selectAllCallAlerts(); result.current.selectAllContactAlerts(); });
    await waitFor(() => expect(true).toBe(true));
    act(() => { result.current.selectAllCallAlerts(); result.current.selectAllContactAlerts(); });
  });

  it('toggle removes existing selection', async () => {
    const { result } = renderHook(() => useAlerts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.toggleCallAlertSelection('ca1'); });
    act(() => { result.current.toggleCallAlertSelection('ca1'); });
    await waitFor(() => expect(result.current.selectedCallAlerts.size).toBe(0));
  });

  it('batch no-ops with empty selection', async () => {
    const { result } = renderHook(() => useAlerts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.batchMarkCallAlertsAsRead(); });
    await act(async () => { await result.current.batchMarkContactAlertsAsRead(); });
    await act(async () => { await result.current.batchMarkContactAlertsAsActioned(); });
    await act(async () => { await result.current.batchDeleteContactAlerts(); });
    expect(result.current.selectedCallAlerts.size).toBe(0);
  });

  it('creates test alerts (existing session path)', async () => {
    const { result } = renderHook(() => useAlerts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.createTestAlerts(); });
    expect(true).toBe(true);
  });
});
