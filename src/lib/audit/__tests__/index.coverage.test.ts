import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAuditEvent, createAuditLogger } from '../index';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const mockRpc = vi.mocked(supabase.rpc);

describe('audit/index (coverage)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('logAuditEvent returns id on success', async () => {
    mockRpc.mockResolvedValue({ data: 'audit-id-1', error: null } as never);
    const id = await logAuditEvent({ action: 'create', resourceType: 'deal', resourceId: 'd1', details: { x: 1 } });
    expect(id).toBe('audit-id-1');
    expect(mockRpc).toHaveBeenCalledWith('log_audit_event', expect.objectContaining({
      p_action: 'create',
      p_resource_type: 'deal',
      p_resource_id: 'd1',
      p_details: { x: 1 },
    }));
  });

  it('logAuditEvent defaults details to empty object and resourceId undefined', async () => {
    mockRpc.mockResolvedValue({ data: 'id2', error: null } as never);
    await logAuditEvent({ action: 'read', resourceType: 'contact' });
    expect(mockRpc).toHaveBeenCalledWith('log_audit_event', expect.objectContaining({
      p_resource_id: undefined,
      p_details: {},
    }));
  });

  it('logAuditEvent returns null on supabase error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } } as never);
    const id = await logAuditEvent({ action: 'delete', resourceType: 'deal', resourceId: 'd1' });
    expect(id).toBeNull();
  });

  it('logAuditEvent returns null on thrown exception', async () => {
    mockRpc.mockRejectedValue(new Error('network'));
    const id = await logAuditEvent({ action: 'update', resourceType: 'deal' });
    expect(id).toBeNull();
  });

  it('createAuditLogger exposes bound action helpers', async () => {
    mockRpc.mockResolvedValue({ data: 'ok', error: null } as never);
    const auditor = createAuditLogger('account');

    await auditor.create('a1', { foo: 'bar' });
    expect(mockRpc).toHaveBeenLastCalledWith('log_audit_event', expect.objectContaining({ p_action: 'create', p_resource_type: 'account', p_resource_id: 'a1' }));

    await auditor.read('a1');
    expect(mockRpc).toHaveBeenLastCalledWith('log_audit_event', expect.objectContaining({ p_action: 'read' }));

    await auditor.update('a1', { changed: true });
    expect(mockRpc).toHaveBeenLastCalledWith('log_audit_event', expect.objectContaining({ p_action: 'update' }));

    await auditor.delete('a1');
    expect(mockRpc).toHaveBeenLastCalledWith('log_audit_event', expect.objectContaining({ p_action: 'delete' }));

    await auditor.export({ count: 5 });
    expect(mockRpc).toHaveBeenLastCalledWith('log_audit_event', expect.objectContaining({ p_action: 'export', p_resource_type: 'account' }));
  });
});
