import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuditLog } from '../useAuditLog';

const rpcMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
const logErr = vi.fn();
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(), warn: vi.fn(), info: vi.fn(),
    create: () => ({ error: (...a: unknown[]) => logErr(...a), warn: vi.fn(), info: vi.fn() }),
  },
}));

describe('useAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rpcMock.mockResolvedValue({ error: null });
  });

  it('logEvent chama rpc com os parâmetros corretos', async () => {
    const { result } = renderHook(() => useAuditLog());
    await act(async () => {
      await result.current.logEvent('create', 'contact', 'c1', { foo: 'bar' });
    });
    expect(rpcMock).toHaveBeenCalledWith('log_audit_event', {
      p_action: 'create',
      p_resource_type: 'contact',
      p_resource_id: 'c1',
      p_details: { foo: 'bar' },
    });
  });

  it('logEvent registra erro quando rpc retorna error', async () => {
    rpcMock.mockResolvedValueOnce({ error: { message: 'denied' } });
    const { result } = renderHook(() => useAuditLog());
    await act(async () => {
      await result.current.logEvent('view', 'agent');
    });
    expect(logErr).toHaveBeenCalled();
  });

  it('logEvent captura exceção lançada', async () => {
    rpcMock.mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useAuditLog());
    await act(async () => {
      await result.current.logEvent('delete', 'call_session', 'x');
    });
    expect(logErr).toHaveBeenCalled();
  });

  it('exercita os helpers específicos', async () => {
    const { result } = renderHook(() => useAuditLog());
    await act(async () => {
      await result.current.logContactAccess('c1', 'Nome');
      await result.current.logContactAccess('c2');
      await result.current.logCallTranscriptionAccess('s1');
      await result.current.logCallRecordingDownload('r1', '/path');
      await result.current.logCallRecordingDownload('r2');
      await result.current.logAgentProfileAccess('a1', 'Agente');
      await result.current.logAgentProfileAccess('a2');
      await result.current.logUserProfileAccess('p1');
      await result.current.logCallAnalysisAccess('s2');
      await result.current.logCoachingAccess('rec1', 'Agente');
      await result.current.logCoachingAccess('rec2');
      await result.current.logDataExport('contact', 42);
    });
    expect(rpcMock).toHaveBeenCalledTimes(12);
  });
});
