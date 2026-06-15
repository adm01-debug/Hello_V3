import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePermissions } from '../usePermissions';

const fromMock = vi.fn();
let mockUser: { id: string } | null = { id: 'u1' };
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...a: unknown[]) => fromMock(...a) },
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuthContext: () => ({ user: mockUser }) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));

const perm = { name: 'calls.view', module: 'calls', action: 'view' };

function setupRolesAndPerms(roles: unknown[], rolePerms: unknown[], opts: { rolesError?: Error; permsError?: Error } = {}) {
  fromMock.mockImplementation((table: string) => {
    if (table === 'user_roles') {
      return { select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: opts.rolesError ? null : roles, error: opts.rolesError ?? null }) })) })) };
    }
    return { select: vi.fn(() => ({ in: vi.fn().mockResolvedValue({ data: opts.permsError ? null : rolePerms, error: opts.permsError ?? null }) })) };
  });
}

describe('usePermissions (coverage)', () => {
  beforeEach(() => { vi.clearAllMocks(); mockUser = { id: 'u1' }; });

  it('loads permissions for active roles', async () => {
    setupRolesAndPerms([{ role: 'admin' }], [{ permissions: perm }]);
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.permissions).toHaveLength(1);
    expect(result.current.hasPermission('calls.view')).toBe(true);
    expect(result.current.hasPermission('nope')).toBe(false);
    expect(result.current.hasAnyPermission(['calls.view', 'x'])).toBe(true);
    expect(result.current.hasAllPermissions(['calls.view'])).toBe(true);
    expect(result.current.hasAllPermissions(['calls.view', 'x'])).toBe(false);
    expect(result.current.canAccess('calls')).toBe(true);
    expect(result.current.canAccess('calls', 'view')).toBe(true);
    expect(result.current.canAccess('calls', 'delete')).toBe(false);
  });

  it('returns empty when no user', async () => {
    mockUser = null;
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.permissions).toEqual([]);
  });

  it('returns empty when user has no roles', async () => {
    setupRolesAndPerms([], []);
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.permissions).toEqual([]);
  });

  it('handles roles fetch error', async () => {
    setupRolesAndPerms([], [], { rolesError: new Error('roles') });
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.permissions).toEqual([]);
  });

  it('handles perms fetch error', async () => {
    setupRolesAndPerms([{ role: 'admin' }], [], { permsError: new Error('perms') });
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.permissions).toEqual([]);
  });

  it('refresh re-runs loadPermissions', async () => {
    setupRolesAndPerms([{ role: 'admin' }], [{ permissions: perm }]);
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(async () => { await result.current.refresh(); });
    expect(result.current.permissions).toHaveLength(1);
  });
});
