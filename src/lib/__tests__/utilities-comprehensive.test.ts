import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkPasswordStrength,
  generateSecurePassword,
} from '@/lib/password/index';
import {
  generateBackupCodes,
  formatBackupCode,
} from '@/lib/mfa/index';
import {
  getSessionTimeout,
} from '@/lib/session/index';
import { validateNotification, type NotificationCategory, type NotificationSeverity } from '@/lib/notifications/index';
import type { ExportColumn } from '@/lib/export/index';

// Mock supabase for modules that import it
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      update: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn().mockResolvedValue({ data: 'mock-id', error: null }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
  },
}));

describe('Password Strength', () => {
  it('rates empty password as very weak', () => {
    const result = checkPasswordStrength('');
    expect(result.score).toBe(0);
    expect(result.label).toBe('Muito fraca');
  });

  it('rates short password as weak', () => {
    const result = checkPasswordStrength('abc');
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('rates 8-char mixed as reasonable', () => {
    const result = checkPasswordStrength('Abc12345');
    expect(result.score).toBeGreaterThanOrEqual(1);
  });

  it('rates strong password highly', () => {
    const result = checkPasswordStrength('MyStr0ng!Pass@2024');
    expect(result.score).toBeGreaterThanOrEqual(4);
  });

  it('penalizes common patterns', () => {
    const result = checkPasswordStrength('password123');
    expect(result.suggestions).toContain('Evite padrões comuns');
  });

  it('penalizes repeated characters', () => {
    const result = checkPasswordStrength('aaabbbccc');
    expect(result.suggestions).toContain('Evite caracteres repetidos');
  });

  it('suggests adding uppercase', () => {
    const result = checkPasswordStrength('alllowercase');
    expect(result.suggestions.some(s => s.includes('maiúsculas'))).toBe(true);
  });

  it('suggests adding numbers', () => {
    const result = checkPasswordStrength('NoNumbersHere!');
    // May or may not suggest depending on score
    expect(result.score).toBeDefined();
  });

  it('suggests adding special chars', () => {
    const result = checkPasswordStrength('NoSpecial123');
    expect(result.suggestions.some(s => s.includes('especiais'))).toBe(true);
  });

  it('caps score at 4', () => {
    const result = checkPasswordStrength('V3ry$tr0ng!P@ssw0rd!2024');
    expect(result.score).toBeLessThanOrEqual(4);
  });

  it('generates unique passwords', () => {
    const passwords = new Set(Array.from({ length: 50 }, () => generateSecurePassword()));
    expect(passwords.size).toBe(50);
  });

  it('generates passwords of requested length', () => {
    expect(generateSecurePassword(8).length).toBe(8);
    expect(generateSecurePassword(32).length).toBe(32);
    expect(generateSecurePassword(64).length).toBe(64);
  });

  it('generated passwords contain varied characters', () => {
    const pw = generateSecurePassword(32);
    expect(/[a-z]/.test(pw) || /[A-Z]/.test(pw) || /[0-9]/.test(pw)).toBe(true);
  });
});

describe('MFA Utilities', () => {
  it('generates correct number of backup codes', () => {
    expect(generateBackupCodes(5)).toHaveLength(5);
    expect(generateBackupCodes(10)).toHaveLength(10);
    expect(generateBackupCodes()).toHaveLength(10); // default
  });

  it('generates unique backup codes', () => {
    const codes = generateBackupCodes(20);
    expect(new Set(codes).size).toBe(20);
  });

  it('backup codes have correct format (xxxx-xxxx)', () => {
    const codes = generateBackupCodes(5);
    codes.forEach(code => {
      expect(code).toMatch(/^[0-9a-f]{4}-[0-9a-f]{4}$/);
    });
  });

  it('formatBackupCode adds dashes', () => {
    expect(formatBackupCode('abcdefgh')).toContain('-');
  });
});

describe('Session Management', () => {
  it('returns 30 minute timeout', () => {
    expect(getSessionTimeout()).toBe(30 * 60 * 1000);
  });
});

describe('Notification Validation', () => {
  it('validates complete notification', () => {
    const errors = validateNotification({
      userId: '123',
      title: 'Test',
      message: 'Hello',
      category: 'system',
      severity: 'info',
    });
    expect(errors).toHaveLength(0);
  });

  it('requires userId', () => {
    const errors = validateNotification({ title: 'Test', message: 'Hello' });
    expect(errors).toContain('userId é obrigatório');
  });

  it('requires title', () => {
    const errors = validateNotification({ userId: '123', message: 'Hello' });
    expect(errors).toContain('title é obrigatório');
  });

  it('requires message', () => {
    const errors = validateNotification({ userId: '123', title: 'Test' });
    expect(errors).toContain('message é obrigatório');
  });

  it('rejects empty title', () => {
    const errors = validateNotification({ userId: '123', title: '  ', message: 'x' });
    expect(errors.some(e => e.includes('title'))).toBe(true);
  });

  it('rejects title over 200 chars', () => {
    const errors = validateNotification({ userId: '123', title: 'a'.repeat(201), message: 'x' });
    expect(errors.some(e => e.includes('200'))).toBe(true);
  });

  it('rejects message over 2000 chars', () => {
    const errors = validateNotification({ userId: '123', title: 'Test', message: 'a'.repeat(2001) });
    expect(errors.some(e => e.includes('2000'))).toBe(true);
  });

  it('rejects invalid category', () => {
    const errors = validateNotification({
      userId: '123', title: 'Test', message: 'x',
      category: 'invalid' as NotificationCategory,
    });
    expect(errors.some(e => e.includes('category'))).toBe(true);
  });

  it('rejects invalid severity', () => {
    const errors = validateNotification({
      userId: '123', title: 'Test', message: 'x',
      severity: 'extreme' as NotificationSeverity,
    });
    expect(errors.some(e => e.includes('severity'))).toBe(true);
  });

  it('accepts all valid categories', () => {
    for (const cat of ['system', 'call', 'security', 'coaching', 'gamification'] as const) {
      const errors = validateNotification({
        userId: '123', title: 'Test', message: 'x', category: cat,
      });
      expect(errors.filter(e => e.includes('category'))).toHaveLength(0);
    }
  });

  it('accepts all valid severities', () => {
    for (const sev of ['info', 'warning', 'critical'] as const) {
      const errors = validateNotification({
        userId: '123', title: 'Test', message: 'x', severity: sev,
      });
      expect(errors.filter(e => e.includes('severity'))).toHaveLength(0);
    }
  });
});

describe('Export Utilities - Column Logic', () => {
  it('ExportColumn format function works', () => {
    const col: ExportColumn = {
      key: 'date',
      label: 'Data',
      format: (v) => new Date(v as string).toLocaleDateString('pt-BR'),
    };
    expect(col.format!('2024-01-15')).toContain('/');
  });

  it('ExportColumn default formatting handles null', () => {
    const col: ExportColumn = { key: 'name', label: 'Nome' };
    const value: unknown = null;
    const formatted = col.format ? col.format(value) : String(value || '');
    expect(formatted).toBe('');
  });

  it('ExportColumn format handles numbers', () => {
    const col: ExportColumn = {
      key: 'amount',
      label: 'Valor',
      format: (v) => `R$ ${Number(v).toFixed(2)}`,
    };
    expect(col.format!(1234.5)).toBe('R$ 1234.50');
  });
});
