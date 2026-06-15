import { describe, it, expect, vi, beforeEach } from 'vitest';

const builder: Record<string, ReturnType<typeof vi.fn>> = {};
const from = vi.fn(() => builder);
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (...a: unknown[]) => (from as (...args: unknown[]) => unknown)(...a) } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { getActiveSessions, terminateSession, terminateAllOtherSessions, getSessionTimeout } from '../index';

function setupSelect(result: { data: unknown }) {
  builder.select = vi.fn().mockReturnThis();
  builder.eq = vi.fn().mockReturnThis();
  builder.order = vi.fn().mockResolvedValue(result);
}
function setupUpdate(result: { error: unknown }) {
  builder.update = vi.fn().mockReturnThis();
  builder.eq = vi.fn().mockReturnThis();
  builder.neq = vi.fn().mockResolvedValue(result);
  // for single-eq update, the last eq must resolve
  builder.eq = vi.fn(() => ({ ...builder, then: undefined }));
}

describe('session/index', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getActiveSessions maps rows', async () => {
    setupSelect({ data: [{ id: '1', user_id: 'u', ip_address: '1.1.1.1', user_agent: 'UA', device_info: { os: 'x' }, is_active: true, last_activity_at: 'now', created_at: 'then' }] });
    const sessions = await getActiveSessions('u');
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ id: '1', userId: 'u', ipAddress: '1.1.1.1', isActive: true });
  });

  it('getActiveSessions handles null data and is_active falsy', async () => {
    setupSelect({ data: null });
    expect(await getActiveSessions('u')).toEqual([]);

    setupSelect({ data: [{ id: '2', user_id: 'u', ip_address: null, user_agent: null, device_info: null, is_active: null, last_activity_at: null, created_at: null }] });
    const s = await getActiveSessions('u');
    expect(s[0].isActive).toBe(false);
  });

  it('terminateSession returns true when no error', async () => {
    builder.update = vi.fn().mockReturnThis();
    builder.eq = vi.fn().mockResolvedValue({ error: null });
    expect(await terminateSession('s1')).toBe(true);
  });

  it('terminateSession returns false on error', async () => {
    builder.update = vi.fn().mockReturnThis();
    builder.eq = vi.fn().mockResolvedValue({ error: { message: 'bad' } });
    expect(await terminateSession('s1')).toBe(false);
  });

  it('terminateAllOtherSessions success and error', async () => {
    builder.update = vi.fn().mockReturnThis();
    builder.eq = vi.fn().mockReturnThis();
    builder.neq = vi.fn().mockResolvedValue({ error: null });
    expect(await terminateAllOtherSessions('u', 'cur')).toBe(true);

    builder.neq = vi.fn().mockResolvedValue({ error: { message: 'x' } });
    expect(await terminateAllOtherSessions('u', 'cur')).toBe(false);
  });

  it('getSessionTimeout returns 30 minutes', () => {
    expect(getSessionTimeout()).toBe(30 * 60 * 1000);
  });
});
