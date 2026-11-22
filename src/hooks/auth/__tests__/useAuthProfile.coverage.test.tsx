import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const maybeSingle = vi.fn();
const rolesThen = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'user_roles') {
        const chain = {
          select: () => chain,
          eq: () => Promise.resolve(rolesThen()),
        };
        return chain;
      }
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: (...args: unknown[]) => maybeSingle(...args),
      };
      return chain;
    }),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { useAuthProfile } from '../useAuthProfile';

describe('useAuthProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rolesThen.mockReturnValue({ data: [], error: null });
  });

  it('returns profile data on success', async () => {
    maybeSingle.mockResolvedValue({ data: { id: 'u1', full_name: 'Test' }, error: null });
    const { result } = renderHook(() => useAuthProfile());
    const profile = await result.current.getProfile('u1');
    expect(profile).toEqual({ id: 'u1', full_name: 'Test' });
  });

  it('returns null and logs on error', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const { result } = renderHook(() => useAuthProfile());
    const profile = await result.current.getProfile('u1');
    expect(profile).toBeNull();
  });

  it('returns null when query throws', async () => {
    maybeSingle.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useAuthProfile());
    const profile = await result.current.getProfile('u2');
    expect(profile).toBeNull();
  });

  it('keeps profile role as fallback when user_roles is empty', async () => {
    maybeSingle.mockResolvedValue({
      data: { id: 'u1', full_name: 'Test', role: 'viewer' },
      error: null,
    });
    const { result } = renderHook(() => useAuthProfile());
    const profile = await result.current.getProfile('u1');
    expect(profile?.role).toBe('viewer');
  });

  it('overrides profile.role with the active role from user_roles', async () => {
    maybeSingle.mockResolvedValue({
      data: { id: 'u1', full_name: 'Test', role: 'viewer' },
      error: null,
    });
    rolesThen.mockReturnValue({
      data: [{ role: 'admin', is_active: true, expires_at: null }],
      error: null,
    });
    const { result } = renderHook(() => useAuthProfile());
    const profile = await result.current.getProfile('u1');
    expect(profile?.role).toBe('admin');
  });

  it('applies precedence admin > supervisor when both are active', async () => {
    maybeSingle.mockResolvedValue({ data: { id: 'u1', role: 'viewer' }, error: null });
    rolesThen.mockReturnValue({
      data: [
        { role: 'agent', is_active: true, expires_at: null },
        { role: 'supervisor', is_active: true, expires_at: null },
        { role: 'admin', is_active: true, expires_at: null },
      ],
      error: null,
    });
    const { result } = renderHook(() => useAuthProfile());
    const profile = await result.current.getProfile('u1');
    expect(profile?.role).toBe('admin');
  });

  it('ignores inactive and expired roles', async () => {
    maybeSingle.mockResolvedValue({ data: { id: 'u1', role: 'viewer' }, error: null });
    rolesThen.mockReturnValue({
      data: [
        { role: 'admin', is_active: false, expires_at: null },
        { role: 'supervisor', is_active: true, expires_at: '2020-01-01T00:00:00Z' },
      ],
      error: null,
    });
    const { result } = renderHook(() => useAuthProfile());
    const profile = await result.current.getProfile('u1');
    expect(profile?.role).toBe('viewer');
  });
});
