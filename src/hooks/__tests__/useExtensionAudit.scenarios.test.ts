import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExtensionAudit } from '@/hooks/useExtensionAudit';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const rpcMock = supabase.rpc as unknown as ReturnType<typeof vi.fn>;

describe('useExtensionAudit — cenários (fire-and-forget)', () => {
  beforeEach(() => {
    rpcMock.mockReset();
    (logger.error as ReturnType<typeof vi.fn>).mockReset();
  });

  it('envia RPC log_audit_event com payload correto', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useExtensionAudit());
    await act(async () => {
      await result.current.logBulk({
        action: 'bulk_assign_trunk',
        agentIds: ['a1', 'a2'],
        details: { trunk_id: 'tk1' },
      });
    });
    expect(rpcMock).toHaveBeenCalledWith('log_audit_event', expect.objectContaining({
      p_action: 'bulk_assign_trunk',
      p_resource_type: 'extension_bulk',
    }));
    const args = rpcMock.mock.calls[0][1];
    expect(args.p_details).toMatchObject({ agent_ids: ['a1', 'a2'], count: 2, trunk_id: 'tk1' });
  });

  it('lida com erro do RPC sem lançar (fire-and-forget)', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'PG error' } });
    const { result } = renderHook(() => useExtensionAudit());
    await expect(
      act(async () => {
        await result.current.logBulk({ action: 'bulk_export_csv', agentIds: ['a1'] });
      }),
    ).resolves.not.toThrow();
    expect(logger.error).toHaveBeenCalled();
  });

  it('lida com exception do RPC sem propagar', async () => {
    rpcMock.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useExtensionAudit());
    await expect(
      act(async () => {
        await result.current.logBulk({ action: 'bulk_force_offline', agentIds: ['x'] });
      }),
    ).resolves.not.toThrow();
    expect(logger.error).toHaveBeenCalled();
  });

  it('aceita payloads grandes (1000 agent ids)', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useExtensionAudit());
    const ids = Array.from({ length: 1000 }, (_, i) => `agent-${i}`);
    await act(async () => {
      await result.current.logBulk({ action: 'bulk_export_csv', agentIds: ids });
    });
    const args = rpcMock.mock.calls[0][1];
    expect(args.p_details.count).toBe(1000);
  });

  it('preserva caracteres UTF-8 e emojis nos detalhes', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useExtensionAudit());
    await act(async () => {
      await result.current.logBulk({
        action: 'bulk_assign_trunk',
        agentIds: ['a'],
        details: { motivo: '🚀 Atualização — manutenção programada (acentuação OK)' },
      });
    });
    const args = rpcMock.mock.calls[0][1];
    expect(args.p_details.motivo).toContain('🚀');
    expect(args.p_details.motivo).toContain('Atualização');
  });

  it('agentIds vazios ainda fazem o log (count=0)', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useExtensionAudit());
    await act(async () => {
      await result.current.logBulk({ action: 'bulk_export_csv', agentIds: [] });
    });
    const args = rpcMock.mock.calls[0][1];
    expect(args.p_details.count).toBe(0);
  });
});
