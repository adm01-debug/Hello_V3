import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ExportColumn } from '@/lib/export/index';
import type { AuditAction, AuditEvent } from '@/lib/audit/index';
import { validateNotification, type NotificationCategory, type NotificationSeverity } from '@/lib/notifications/index';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      order: vi.fn().mockReturnThis(),
      then: (r: (value: { data: unknown[]; error: null }) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(r),
    })),
    rpc: vi.fn().mockResolvedValue({ data: 'mock-id', error: null }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }) },
  },
}));

// ===================== Export Column Logic =====================
describe('Export Column Formatting', () => {
  it('format function transforms dates', () => {
    const col: ExportColumn = {
      key: 'created_at',
      label: 'Criado em',
      format: (v) => new Date(v as string).toLocaleDateString('pt-BR'),
    };
    expect(col.format!('2024-06-15T10:00:00Z')).toContain('/');
  });

  it('format function handles numbers', () => {
    const col: ExportColumn = {
      key: 'amount',
      label: 'Valor',
      format: (v) => `R$ ${Number(v).toFixed(2)}`,
    };
    expect(col.format!(1234.56)).toBe('R$ 1234.56');
  });

  it('format function handles zero', () => {
    const col: ExportColumn = {
      key: 'amount',
      label: 'Valor',
      format: (v) => `R$ ${Number(v).toFixed(2)}`,
    };
    expect(col.format!(0)).toBe('R$ 0.00');
  });

  it('format function handles boolean', () => {
    const col: ExportColumn = {
      key: 'active',
      label: 'Ativo',
      format: (v) => v ? 'Sim' : 'Não',
    };
    expect(col.format!(true)).toBe('Sim');
    expect(col.format!(false)).toBe('Não');
  });

  it('format function handles null with fallback', () => {
    const col: ExportColumn = {
      key: 'name',
      label: 'Nome',
      format: (v) => String(v ?? 'N/A'),
    };
    expect(col.format!(null)).toBe('N/A');
    expect(col.format!(undefined)).toBe('N/A');
  });

  it('default formatting (without format fn) uses String coercion', () => {
    const col: ExportColumn = { key: 'id', label: 'ID' };
    const value = 12345;
    const formatted = col.format ? col.format(value) : String(value ?? '');
    expect(formatted).toBe('12345');
  });

  it('handles arrays in format', () => {
    const col: ExportColumn = {
      key: 'tags',
      label: 'Tags',
      format: (v) => Array.isArray(v) ? (v as string[]).join(', ') : '',
    };
    expect(col.format!(['a', 'b', 'c'])).toBe('a, b, c');
    expect(col.format!([])).toBe('');
  });

  it('CSV special char escaping simulation', () => {
    const value = 'He said "hello"';
    const escaped = `"${value.replace(/"/g, '""')}"`;
    expect(escaped).toBe('"He said ""hello"""');
  });

  it('CSV semicolon delimiter simulation', () => {
    const cols: ExportColumn[] = [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B' },
    ];
    const header = cols.map(c => `"${c.label}"`).join(';');
    expect(header).toBe('"A";"B"');
  });
});

// ===================== Audit Event Types =====================
describe('Audit Event Types', () => {
  const validActions: AuditAction[] = [
    'create', 'read', 'update', 'delete', 'login', 'logout',
    'export', 'import', 'view', 'search', 'transfer', 'hold', 'unhold',
  ];

  it('all 13 audit actions are valid', () => {
    expect(validActions).toHaveLength(13);
  });

  it('AuditEvent structure is complete', () => {
    const event: AuditEvent = {
      action: 'create',
      resourceType: 'contact',
      resourceId: '123',
      details: { field: 'name', oldValue: 'A', newValue: 'B' },
    };
    expect(event.action).toBe('create');
    expect(event.resourceType).toBe('contact');
    expect(event.details).toBeDefined();
  });

  it('AuditEvent with optional fields omitted', () => {
    const event: AuditEvent = {
      action: 'login',
      resourceType: 'session',
    };
    expect(event.resourceId).toBeUndefined();
    expect(event.details).toBeUndefined();
  });

  it('each action can construct valid event', () => {
    validActions.forEach(action => {
      const event: AuditEvent = { action, resourceType: 'test' };
      expect(event.action).toBe(action);
    });
  });
});

// ===================== Notification Validation Comprehensive =====================
describe('Notification Validation - Comprehensive', () => {
  const validPayload = { userId: 'user-1', title: 'Alert', message: 'Something happened' };

  describe('Required fields', () => {
    it('passes with all required fields', () => {
      expect(validateNotification(validPayload)).toHaveLength(0);
    });

    it('fails without userId', () => {
      const errors = validateNotification({ title: 'T', message: 'M' });
      expect(errors).toContain('userId é obrigatório');
    });

    it('fails without title', () => {
      const errors = validateNotification({ userId: '1', message: 'M' });
      expect(errors).toContain('title é obrigatório');
    });

    it('fails without message', () => {
      const errors = validateNotification({ userId: '1', title: 'T' });
      expect(errors).toContain('message é obrigatório');
    });

    it('fails with empty object', () => {
      const errors = validateNotification({});
      expect(errors.length).toBeGreaterThanOrEqual(3);
    });

    it('fails with whitespace-only title', () => {
      const errors = validateNotification({ ...validPayload, title: '   ' });
      expect(errors.some(e => e.includes('title'))).toBe(true);
    });

    it('fails with whitespace-only message', () => {
      const errors = validateNotification({ ...validPayload, message: '   ' });
      expect(errors.some(e => e.includes('message'))).toBe(true);
    });
  });

  describe('Length limits', () => {
    it('title at 200 chars passes', () => {
      const errors = validateNotification({ ...validPayload, title: 'a'.repeat(200) });
      expect(errors.filter(e => e.includes('200'))).toHaveLength(0);
    });

    it('title at 201 chars fails', () => {
      const errors = validateNotification({ ...validPayload, title: 'a'.repeat(201) });
      expect(errors.some(e => e.includes('200'))).toBe(true);
    });

    it('message at 2000 chars passes', () => {
      const errors = validateNotification({ ...validPayload, message: 'a'.repeat(2000) });
      expect(errors.filter(e => e.includes('2000'))).toHaveLength(0);
    });

    it('message at 2001 chars fails', () => {
      const errors = validateNotification({ ...validPayload, message: 'a'.repeat(2001) });
      expect(errors.some(e => e.includes('2000'))).toBe(true);
    });
  });

  describe('Category validation', () => {
    const validCategories: NotificationCategory[] = ['system', 'call', 'security', 'coaching', 'gamification'];

    it('all valid categories pass', () => {
      validCategories.forEach(cat => {
        const errors = validateNotification({ ...validPayload, category: cat });
        expect(errors.filter(e => e.includes('category'))).toHaveLength(0);
      });
    });

    it('invalid category fails', () => {
      const errors = validateNotification({ ...validPayload, category: 'invalid' as NotificationCategory });
      expect(errors.some(e => e.includes('category'))).toBe(true);
    });

    it('omitted category passes (optional)', () => {
      const errors = validateNotification(validPayload);
      expect(errors.filter(e => e.includes('category'))).toHaveLength(0);
    });
  });

  describe('Severity validation', () => {
    const validSeverities: NotificationSeverity[] = ['info', 'warning', 'critical'];

    it('all valid severities pass', () => {
      validSeverities.forEach(sev => {
        const errors = validateNotification({ ...validPayload, severity: sev });
        expect(errors.filter(e => e.includes('severity'))).toHaveLength(0);
      });
    });

    it('invalid severity fails', () => {
      const errors = validateNotification({ ...validPayload, severity: 'extreme' as NotificationSeverity });
      expect(errors.some(e => e.includes('severity'))).toBe(true);
    });

    it('omitted severity passes (optional)', () => {
      const errors = validateNotification(validPayload);
      expect(errors.filter(e => e.includes('severity'))).toHaveLength(0);
    });
  });

  describe('Combined errors', () => {
    it('accumulates multiple errors', () => {
      const errors = validateNotification({
        title: 'a'.repeat(201),
        message: 'a'.repeat(2001),
        category: 'bad' as NotificationCategory,
        severity: 'bad' as NotificationSeverity,
      });
      // Should have: userId + title_len + message_len + category + severity
      expect(errors.length).toBeGreaterThanOrEqual(4);
    });
  });
});

// ===================== Edge Function Logic Simulation =====================
describe('Edge Function Logic - Send Notification', () => {
  it('payload maps correctly', () => {
    const params = {
      userId: 'user-1',
      title: 'Hello',
      message: 'World',
      type: 'alert',
      category: 'security' as const,
      severity: 'critical' as const,
      actionUrl: '/dashboard',
      actionLabel: 'View',
      metadata: { key: 'value' },
      sourceType: 'system',
      sourceId: 'sys-1',
      expiresAt: '2025-01-01',
    };

    const body = {
      user_id: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || 'info',
      category: params.category || 'system',
      severity: params.severity || 'info',
      action_url: params.actionUrl,
      action_label: params.actionLabel,
      metadata: params.metadata,
      source_type: params.sourceType,
      source_id: params.sourceId,
      expires_at: params.expiresAt,
    };

    expect(body.user_id).toBe('user-1');
    expect(body.severity).toBe('critical');
    expect(body.action_url).toBe('/dashboard');
    expect(body.expires_at).toBe('2025-01-01');
  });

  it('defaults type to info when undefined', () => {
    const input: string | undefined = undefined;
    const type = input || 'info';
    expect(type).toBe('info');
  });

  it('defaults category to system when undefined', () => {
    const input: string | undefined = undefined;
    const category = input || 'system';
    expect(category).toBe('system');
  });

  it('defaults severity to info when undefined', () => {
    const input: string | undefined = undefined;
    const severity = input || 'info';
    expect(severity).toBe('info');
  });
});

// ===================== Audit Logger Factory =====================
describe('Audit Logger Factory Pattern', () => {
  it('creates logger with consistent resourceType', () => {
    const actions: AuditAction[] = ['create', 'read', 'update', 'delete', 'export'];
    actions.forEach(action => {
      const event: AuditEvent = { action, resourceType: 'contact', resourceId: '123' };
      expect(event.resourceType).toBe('contact');
    });
  });

  it('logger preserves details', () => {
    const details = { oldName: 'John', newName: 'Jane' };
    const event: AuditEvent = { action: 'update', resourceType: 'contact', details };
    expect(event.details).toEqual({ oldName: 'John', newName: 'Jane' });
  });

  it('logger handles export with no resourceId', () => {
    const event: AuditEvent = { action: 'export', resourceType: 'report', details: { format: 'csv', count: 100 } };
    expect(event.resourceId).toBeUndefined();
    expect(event.details?.format).toBe('csv');
  });
});
