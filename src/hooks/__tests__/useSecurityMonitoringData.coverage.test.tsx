import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  logsLimitMock: vi.fn(),
  alertsLimitMock: vi.fn(),
  updateEqMock: vi.fn(),
  removeChannelMock: vi.fn(),
  // capture realtime callbacks by channel name
  handlers: {} as Record<string, (payload: unknown) => void>,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: table === 'audit_logs' ? h.logsLimitMock : h.alertsLimitMock,
        })),
      })),
      update: vi.fn(() => ({ eq: h.updateEqMock })),
    })),
    channel: vi.fn((name: string) => {
      const obj: Record<string, unknown> = {};
      obj.on = (_evt: string, _cfg: unknown, cb: (payload: unknown) => void) => {
        h.handlers[name] = cb;
        return obj;
      };
      obj.subscribe = () => obj;
      return obj;
    }),
    removeChannel: h.removeChannelMock,
  },
}));

import { useSecurityMonitoringData } from '@/hooks/useSecurityMonitoringData';
import { toast } from 'sonner';

const now = new Date().toISOString();
const logs = [
  { id: 'l1', user_id: 'u1', user_email: 'a@x.com', user_role: 'admin', action: 'view', resource_type: 'lead', resource_id: '1', details: {}, created_at: now },
  { id: 'l2', user_id: 'u2', user_email: 'b@x.com', user_role: 'agent', action: 'export', resource_type: 'deal', resource_id: '2', details: {}, created_at: now },
  { id: 'l3', user_id: 'u1', user_email: 'a@x.com', user_role: 'admin', action: 'download', resource_type: 'file', resource_id: '3', details: {}, created_at: now },
];
const alerts = [
  { id: 'al1', alert_type: 'login', severity: 'critical', title: 'T', description: 'D', source_user_id: 'u1', source_user_email: 'a@x.com', trigger_data: {}, is_resolved: false, resolved_at: null, resolved_by: null, created_at: now },
];

beforeEach(() => {
  vi.clearAllMocks();
  h.handlers = {};
  h.logsLimitMock.mockResolvedValue({ data: logs, error: null });
  h.alertsLimitMock.mockResolvedValue({ data: alerts, error: null });
  h.updateEqMock.mockResolvedValue({ error: null });
});

describe('useSecurityMonitoringData', () => {
  it('fetches logs, alerts and computes stats', async () => {
    const { result } = renderHook(() => useSecurityMonitoringData('me@x.com'));
    await waitFor(() => expect(result.current.recentLogs.length).toBe(3));
    expect(result.current.stats.totalEvents).toBe(3);
    expect(result.current.stats.viewEvents).toBe(1);
    expect(result.current.stats.exportEvents).toBe(1);
    expect(result.current.stats.downloadEvents).toBe(1);
    expect(result.current.stats.uniqueUsers).toBe(2);
    expect(result.current.stats.criticalAlerts).toBe(1);
  });

  it('handles null data from queries', async () => {
    h.logsLimitMock.mockResolvedValue({ data: null, error: { message: 'x' } });
    h.alertsLimitMock.mockResolvedValue({ data: null, error: { message: 'y' } });
    const { result } = renderHook(() => useSecurityMonitoringData('me@x.com'));
    await waitFor(() => expect(result.current.recentLogs).toEqual([]));
    expect(result.current.stats.totalEvents).toBe(0);
  });

  it('processes realtime log and alert insert payloads', async () => {
    const { result } = renderHook(() => useSecurityMonitoringData('me@x.com'));
    await waitFor(() => expect(result.current.recentLogs.length).toBe(3));

    act(() => {
      h.handlers['audit-logs-realtime']?.({
        new: { id: 'l4', action: 'view', resource_type: 'x', user_email: 'c@x.com', created_at: now },
      });
    });
    await waitFor(() => expect(result.current.recentLogs.length).toBe(4));
    expect(toast.info).toHaveBeenCalled();
    expect(result.current.stats.viewEvents).toBe(2);

    act(() => {
      h.handlers['audit-logs-realtime']?.({
        new: { id: 'l5', action: 'export', resource_type: 'x', user_email: null, created_at: now },
      });
    });
    await waitFor(() => expect(result.current.stats.exportEvents).toBe(2));

    act(() => {
      h.handlers['security-alerts-realtime']?.({
        new: { id: 'al2', severity: 'critical', title: 'Crit', description: 'd', created_at: now },
      });
    });
    await waitFor(() => expect(result.current.alerts.length).toBe(2));
    expect(toast.error).toHaveBeenCalled();

    act(() => {
      h.handlers['security-alerts-realtime']?.({
        new: { id: 'al3', severity: 'low', title: 'Low', description: 'd', created_at: now },
      });
    });
    await waitFor(() => expect(result.current.alerts.length).toBe(3));
  });

  it('does not subscribe when not live', async () => {
    const { result } = renderHook(() => useSecurityMonitoringData('me@x.com'));
    await waitFor(() => expect(result.current.recentLogs.length).toBe(3));
    act(() => result.current.setIsLive(false));
    await waitFor(() => expect(result.current.isLive).toBe(false));
  });

  it('resolves an alert successfully', async () => {
    const { result } = renderHook(() => useSecurityMonitoringData('me@x.com'));
    await waitFor(() => expect(result.current.alerts.length).toBe(1));
    await act(async () => { await result.current.resolveAlert('al1'); });
    expect(result.current.alerts[0].is_resolved).toBe(true);
    expect(toast.success).toHaveBeenCalledWith('Alerta resolvido');
  });

  it('does not update state when resolve fails', async () => {
    h.updateEqMock.mockResolvedValueOnce({ error: { message: 'fail' } });
    const { result } = renderHook(() => useSecurityMonitoringData(undefined));
    await waitFor(() => expect(result.current.alerts.length).toBe(1));
    await act(async () => { await result.current.resolveAlert('al1'); });
    expect(result.current.alerts[0].is_resolved).toBe(false);
  });
});
