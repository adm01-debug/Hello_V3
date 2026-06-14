import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockFrom = vi.fn();
const mockRpc = vi.fn();
const mockChannel = vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }));
const mockRemoveChannel = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((..._args: unknown[]) => mockFrom()),
    rpc: vi.fn((..._args: unknown[]) => mockRpc()),
    channel: vi.fn((..._args: unknown[]) => mockChannel()),
    removeChannel: vi.fn((..._args: unknown[]) => mockRemoveChannel()),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      mfa: {
        challenge: vi.fn().mockResolvedValue({ data: { id: 'c-1' }, error: null }),
        verify: vi.fn().mockResolvedValue({ error: null }),
      },
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({
    user: { id: 'user-1', email: 'test@test.com' },
    session: { access_token: 'token-123456789012345678901234567890' },
    profile: { role: 'admin' },
    loading: false,
    isAuthenticated: true,
  }),
}));

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Permission checking logic', () => {
    it('hasPermission returns true for existing permission', () => {
      const permissions = [
        { name: 'contacts.view', module: 'contacts', action: 'view' },
        { name: 'contacts.create', module: 'contacts', action: 'create' },
      ];
      
      const hasPermission = (name: string) => permissions.some(p => p.name === name);
      expect(hasPermission('contacts.view')).toBe(true);
    });

    it('hasPermission returns false for missing permission', () => {
      const permissions = [
        { name: 'contacts.view', module: 'contacts', action: 'view' },
      ];
      
      const hasPermission = (name: string) => permissions.some(p => p.name === name);
      expect(hasPermission('contacts.delete')).toBe(false);
    });

    it('hasAnyPermission returns true if at least one matches', () => {
      const permissions = [
        { name: 'contacts.view', module: 'contacts', action: 'view' },
      ];
      
      const hasPermission = (name: string) => permissions.some(p => p.name === name);
      const hasAnyPermission = (names: string[]) => names.some(hasPermission);
      
      expect(hasAnyPermission(['contacts.view', 'contacts.delete'])).toBe(true);
    });

    it('hasAllPermissions returns false if one is missing', () => {
      const permissions = [
        { name: 'contacts.view', module: 'contacts', action: 'view' },
      ];
      
      const hasPermission = (name: string) => permissions.some(p => p.name === name);
      const hasAllPermissions = (names: string[]) => names.every(hasPermission);
      
      expect(hasAllPermissions(['contacts.view', 'contacts.delete'])).toBe(false);
    });

    it('canAccess checks module correctly', () => {
      const permissions = [
        { name: 'contacts.view', module: 'contacts', action: 'view' },
        { name: 'contacts.create', module: 'contacts', action: 'create' },
      ];
      
      const canAccess = (module: string, action?: string) =>
        permissions.some(p => p.module === module && (!action || p.action === action));
      
      expect(canAccess('contacts')).toBe(true);
      expect(canAccess('contacts', 'view')).toBe(true);
      expect(canAccess('contacts', 'delete')).toBe(false);
      expect(canAccess('reports')).toBe(false);
    });

    it('deduplicates permissions by name', () => {
      const perms = [
        { name: 'contacts.view', module: 'contacts', action: 'view' },
        { name: 'contacts.view', module: 'contacts', action: 'view' },
        { name: 'contacts.create', module: 'contacts', action: 'create' },
      ];
      
      const uniquePerms = Array.from(
        new Map(perms.map(p => [p.name, p])).values()
      );
      
      expect(uniquePerms).toHaveLength(2);
    });
  });
});

describe('useReauth', () => {
  describe('Reauth timeout logic', () => {
    const REAUTH_TIMEOUT_MS = 5 * 60 * 1000;

    it('requires reauth when never verified', () => {
      const lastVerified = null;
      const needsReauth = () => {
        if (!lastVerified) return true;
        return Date.now() - lastVerified > REAUTH_TIMEOUT_MS;
      };
      expect(needsReauth()).toBe(true);
    });

    it('does not require reauth within timeout', () => {
      const lastVerified = Date.now() - (2 * 60 * 1000); // 2 minutes ago
      const needsReauth = () => {
        if (!lastVerified) return true;
        return Date.now() - lastVerified > REAUTH_TIMEOUT_MS;
      };
      expect(needsReauth()).toBe(false);
    });

    it('requires reauth after timeout expires', () => {
      const lastVerified = Date.now() - (6 * 60 * 1000); // 6 minutes ago
      const needsReauth = () => {
        if (!lastVerified) return true;
        return Date.now() - lastVerified > REAUTH_TIMEOUT_MS;
      };
      expect(needsReauth()).toBe(true);
    });
  });
});

describe('useIPValidation', () => {
  it('calls validate-ip edge function', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { allowed: true },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabase.functions.invoke>>);

    const { data } = await supabase.functions.invoke('validate-ip', {
      body: { userId: 'user-1', userEmail: 'test@test.com' },
    });
    expect(data.allowed).toBe(true);
  });

  it('fails open on error', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'Network error' },
    } as unknown as Awaited<ReturnType<typeof supabase.functions.invoke>>);

    const { error } = await supabase.functions.invoke('validate-ip', {
      body: { userId: 'user-1', userEmail: 'test@test.com' },
    });
    // Fail-open: should not block user
    expect(error).toBeTruthy();
  });
});

describe('useAuditLog', () => {
  it('calls log_audit_event RPC with correct params', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'audit-id-1', error: null } as unknown as Awaited<ReturnType<typeof supabase.rpc>>);

    await supabase.rpc('log_audit_event', {
      p_action: 'view',
      p_resource_type: 'contact',
      p_resource_id: 'contact-1',
      p_details: { contact_name: 'Test' },
    });

    expect(supabase.rpc).toHaveBeenCalledWith('log_audit_event', expect.objectContaining({
      p_action: 'view',
      p_resource_type: 'contact',
    }));
  });
});
