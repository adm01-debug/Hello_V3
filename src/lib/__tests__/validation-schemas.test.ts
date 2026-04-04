import { describe, it, expect, vi } from 'vitest';
import {
  uuidSchema, emailSchema, phoneSchema, isoDateSchema,
  userRoleSchema, userProfileSchema, agentSchema, contactSchema,
  createContactSchema, callSessionSchema, callSummarySchema,
  scheduledCallbackSchema, createCallbackSchema, holdEventSchema,
  dashboardStatsSchema, callAlertSchema, loginFormSchema, registerFormSchema,
  safeParse, safeParseArray,
} from '@/lib/validation/schemas';

const validUUID = '550e8400-e29b-41d4-a716-446655440000';
const validISO = '2024-01-15T10:30:00.000Z';

describe('Primitive Schemas', () => {
  it('uuidSchema accepts valid UUID', () => {
    expect(uuidSchema.safeParse(validUUID).success).toBe(true);
  });
  it('uuidSchema rejects invalid', () => {
    expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false);
  });
  it('emailSchema accepts valid email', () => {
    expect(emailSchema.safeParse('test@example.com').success).toBe(true);
  });
  it('emailSchema rejects invalid', () => {
    expect(emailSchema.safeParse('bad').success).toBe(false);
  });
  it('phoneSchema accepts valid phone', () => {
    expect(phoneSchema.safeParse('+5511999990000').success).toBe(true);
  });
  it('phoneSchema rejects too short', () => {
    expect(phoneSchema.safeParse('123').success).toBe(false);
  });
  it('phoneSchema rejects too long', () => {
    expect(phoneSchema.safeParse('1'.repeat(21)).success).toBe(false);
  });
  it('isoDateSchema accepts ISO with offset', () => {
    expect(isoDateSchema.safeParse('2024-01-15T10:30:00+03:00').success).toBe(true);
  });
  it('isoDateSchema accepts ISO with Z', () => {
    expect(isoDateSchema.safeParse(validISO).success).toBe(true);
  });
  it('isoDateSchema accepts fallback regex format', () => {
    expect(isoDateSchema.safeParse('2024-01-15T10:30:00').success).toBe(true);
  });
  it('isoDateSchema rejects plain date', () => {
    expect(isoDateSchema.safeParse('2024-01-15').success).toBe(false);
  });
});

describe('userRoleSchema', () => {
  it.each(['admin', 'supervisor', 'agent', 'viewer'])('accepts "%s"', (role) => {
    expect(userRoleSchema.safeParse(role).success).toBe(true);
  });
  it('rejects unknown role', () => {
    expect(userRoleSchema.safeParse('superadmin').success).toBe(false);
  });
});

describe('userProfileSchema', () => {
  const valid = { id: validUUID, email: 'a@b.com', full_name: null, role: 'agent', agent_id: null };
  it('accepts valid profile', () => {
    expect(userProfileSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects missing id', () => {
    expect(userProfileSchema.safeParse({ ...valid, id: undefined }).success).toBe(false);
  });
  it('rejects bad role', () => {
    expect(userProfileSchema.safeParse({ ...valid, role: 'god' }).success).toBe(false);
  });
});

describe('agentSchema', () => {
  const valid = { id: validUUID, name: 'Agent', status: 'available', extension: '100', email: null, avatar_url: null, department: null, created_at: validISO, updated_at: validISO };
  it('accepts valid agent', () => {
    expect(agentSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects empty name', () => {
    expect(agentSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
  });
});

describe('contactSchema', () => {
  const valid = { id: validUUID, name: 'Contact', phone: null, email: null, company: null, position: null, notes: null, tags: null, external_id: null, source: null, preferences: null, personality_insights: null, created_at: validISO, updated_at: validISO };
  it('accepts valid contact', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });
  it('accepts contact with tags array', () => {
    expect(contactSchema.safeParse({ ...valid, tags: ['vip', 'new'] }).success).toBe(true);
  });
});

describe('createContactSchema', () => {
  it('accepts minimal contact', () => {
    expect(createContactSchema.safeParse({ name: 'Test' }).success).toBe(true);
  });
  it('rejects empty name', () => {
    expect(createContactSchema.safeParse({ name: '' }).success).toBe(false);
  });
  it('accepts empty string email (or literal)', () => {
    expect(createContactSchema.safeParse({ name: 'X', email: '' }).success).toBe(true);
  });
  it('rejects invalid email', () => {
    expect(createContactSchema.safeParse({ name: 'X', email: 'bad' }).success).toBe(false);
  });
});

describe('callSessionSchema', () => {
  const valid = { id: validUUID, caller_name: null, caller_phone: null, agent_name: null, contact_id: null, status: null, duration_seconds: null, hold_count: null, hold_time_seconds: null, started_at: validISO, ended_at: null, created_at: validISO };
  it('accepts valid session', () => {
    expect(callSessionSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects missing started_at', () => {
    expect(callSessionSchema.safeParse({ ...valid, started_at: undefined }).success).toBe(false);
  });
});

describe('callSummarySchema', () => {
  const valid = { id: validUUID, call_session_id: validUUID, summary: null, main_topics: null, next_steps: null, overall_sentiment: null, customer_satisfaction: null, agent_performance_score: null, created_at: validISO };
  it('accepts valid summary', () => {
    expect(callSummarySchema.safeParse(valid).success).toBe(true);
  });
  it('accepts summary with arrays', () => {
    expect(callSummarySchema.safeParse({ ...valid, main_topics: ['topic1'], next_steps: ['step1'] }).success).toBe(true);
  });
});

describe('scheduledCallbackSchema', () => {
  const valid = { id: validUUID, contact_id: null, caller_name: 'John', caller_phone: '999999', scheduled_at: validISO, notes: null, status: 'pending', priority: 'normal', assigned_agent: null, created_by: null, completed_at: null, created_at: validISO, updated_at: validISO };
  it('accepts valid callback', () => {
    expect(scheduledCallbackSchema.safeParse(valid).success).toBe(true);
  });
});

describe('createCallbackSchema', () => {
  it('accepts valid input', () => {
    expect(createCallbackSchema.safeParse({ caller_name: 'X', caller_phone: '12345678', scheduled_at: '2024-01-01' }).success).toBe(true);
  });
  it('rejects short phone', () => {
    expect(createCallbackSchema.safeParse({ caller_name: 'X', caller_phone: '123', scheduled_at: '2024' }).success).toBe(false);
  });
  it('rejects empty name', () => {
    expect(createCallbackSchema.safeParse({ caller_name: '', caller_phone: '12345678', scheduled_at: '2024' }).success).toBe(false);
  });
  it('accepts all priority values', () => {
    for (const p of ['low', 'normal', 'high', 'urgent']) {
      expect(createCallbackSchema.safeParse({ caller_name: 'X', caller_phone: '12345678', scheduled_at: '2024', priority: p }).success).toBe(true);
    }
  });
  it('rejects invalid priority', () => {
    expect(createCallbackSchema.safeParse({ caller_name: 'X', caller_phone: '12345678', scheduled_at: '2024', priority: 'critical' }).success).toBe(false);
  });
});

describe('holdEventSchema', () => {
  const valid = { id: validUUID, call_session_id: null, agent_name: null, started_at: validISO, ended_at: null, duration_seconds: null, created_at: validISO };
  it('accepts valid hold event', () => {
    expect(holdEventSchema.safeParse(valid).success).toBe(true);
  });
});

describe('dashboardStatsSchema', () => {
  const valid = { totalCallsToday: 10, totalCallsChange: 5, avgCallDuration: 120, durationChange: -3, answeredRate: 95, rateChange: 2, activeAgents: 5, totalAgents: 8 };
  it('accepts valid stats', () => {
    expect(dashboardStatsSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects missing fields', () => {
    expect(dashboardStatsSchema.safeParse({ totalCallsToday: 10 }).success).toBe(false);
  });
});

describe('callAlertSchema', () => {
  const valid = { id: validUUID, call_session_id: validUUID, alert_type: 'hold', severity: 'warning', title: 'Alert', message: 'Msg', is_read: false, created_at: validISO };
  it('accepts valid alert', () => {
    expect(callAlertSchema.safeParse(valid).success).toBe(true);
  });
});

describe('loginFormSchema', () => {
  it('accepts valid login', () => {
    expect(loginFormSchema.safeParse({ email: 'a@b.com', password: '12345678' }).success).toBe(true);
  });
  it('rejects invalid email', () => {
    expect(loginFormSchema.safeParse({ email: 'bad', password: '12345678' }).success).toBe(false);
  });
  it('rejects short password', () => {
    expect(loginFormSchema.safeParse({ email: 'a@b.com', password: '1234' }).success).toBe(false);
  });
});

describe('registerFormSchema', () => {
  it('accepts valid registration', () => {
    expect(registerFormSchema.safeParse({ fullName: 'John', email: 'a@b.com', password: '12345678', confirmPassword: '12345678' }).success).toBe(true);
  });
  it('rejects password mismatch', () => {
    expect(registerFormSchema.safeParse({ fullName: 'John', email: 'a@b.com', password: '12345678', confirmPassword: '87654321' }).success).toBe(false);
  });
  it('rejects short name', () => {
    expect(registerFormSchema.safeParse({ fullName: 'J', email: 'a@b.com', password: '12345678', confirmPassword: '12345678' }).success).toBe(false);
  });
});

describe('safeParse utility', () => {
  it('returns data on valid input', () => {
    const result = safeParse(emailSchema, 'a@b.com', 'email');
    expect(result).toBe('a@b.com');
  });
  it('returns null on invalid input', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = safeParse(emailSchema, 'bad', 'email');
    expect(result).toBeNull();
    expect(spy).toHaveBeenCalled();
  });
  it('works without label', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    safeParse(emailSchema, 'bad');
    expect(spy.mock.calls[0][0]).toContain('unknown');
  });
});

describe('safeParseArray utility', () => {
  it('filters out invalid items', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = safeParseArray(emailSchema, ['a@b.com', 'bad', 'c@d.com'], 'emails');
    expect(result).toEqual(['a@b.com', 'c@d.com']);
    expect(spy).toHaveBeenCalled();
  });
  it('returns empty array when all invalid', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = safeParseArray(emailSchema, ['x', 'y'], 'emails');
    expect(result).toEqual([]);
  });
  it('returns all when all valid', () => {
    const result = safeParseArray(emailSchema, ['a@b.com', 'c@d.com'], 'emails');
    expect(result).toEqual(['a@b.com', 'c@d.com']);
  });
});
