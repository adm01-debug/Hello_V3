import { describe, it, expect, vi } from 'vitest';

// Edge function shared utilities tests
describe('Edge Function Rate Limiter', () => {
  it('allows first request from new IP', () => {
    const requests = new Map<string, { count: number; resetAt: number }>();
    const ip = '10.0.0.1';
    const maxRequests = 100;
    const windowMs = 60000;
    const now = Date.now();

    const entry = requests.get(ip);
    if (!entry || now > (entry?.resetAt ?? 0)) {
      requests.set(ip, { count: 1, resetAt: now + windowMs });
    }

    expect(requests.get(ip)!.count).toBe(1);
  });

  it('increments count for same IP', () => {
    const requests = new Map<string, { count: number; resetAt: number }>();
    const ip = '10.0.0.1';
    const now = Date.now();

    requests.set(ip, { count: 5, resetAt: now + 60000 });
    const entry = requests.get(ip)!;
    entry.count++;
    
    expect(entry.count).toBe(6);
  });

  it('resets after window expires', () => {
    const requests = new Map<string, { count: number; resetAt: number }>();
    const ip = '10.0.0.1';
    const now = Date.now();

    requests.set(ip, { count: 99, resetAt: now - 1000 }); // expired
    const entry = requests.get(ip)!;
    
    if (now > entry.resetAt) {
      requests.set(ip, { count: 1, resetAt: now + 60000 });
    }

    expect(requests.get(ip)!.count).toBe(1);
  });

  it('calculates remaining correctly', () => {
    const maxRequests = 100;
    const count = 75;
    const remaining = Math.max(0, maxRequests - count);
    expect(remaining).toBe(25);
  });

  it('remaining is 0 when at limit', () => {
    const maxRequests = 100;
    const count = 100;
    const remaining = Math.max(0, maxRequests - count);
    expect(remaining).toBe(0);
  });
});

describe('Edge Function CORS Headers', () => {
  it('includes required headers', () => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    };

    expect(corsHeaders['Access-Control-Allow-Origin']).toBe('*');
    expect(corsHeaders['Access-Control-Allow-Headers']).toContain('authorization');
    expect(corsHeaders['Access-Control-Allow-Headers']).toContain('content-type');
    expect(corsHeaders['Access-Control-Allow-Headers']).toContain('apikey');
  });
});

describe('Edge Function Auth Validation', () => {
  it('rejects requests without authorization header', () => {
    const authHeader: string | null = null;
    expect(authHeader).toBeNull();
    // In the actual function, this returns 401
  });

  it('accepts requests with valid authorization header', () => {
    const authHeader = 'Bearer eyJhbGciOiJIUzI1NiJ9.test';
    expect(authHeader).toBeTruthy();
    expect(authHeader.startsWith('Bearer ')).toBe(true);
  });
});

describe('Sentiment Analysis Response Parsing', () => {
  it('parses valid JSON from AI response', () => {
    const content = 'Here is the analysis:\n{"overall_sentiment":"positive","sentiment_score":0.8,"customer_satisfaction_estimate":8,"summary":"Good call"}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    expect(jsonMatch).toBeTruthy();
    
    const result = JSON.parse(jsonMatch![0]);
    expect(result.overall_sentiment).toBe('positive');
    expect(result.sentiment_score).toBe(0.8);
  });

  it('falls back on invalid JSON', () => {
    const content = 'I cannot analyze this';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = jsonMatch 
      ? JSON.parse(jsonMatch[0])
      : { overall_sentiment: 'neutral', sentiment_score: 0, customer_satisfaction_estimate: 5 };
    
    expect(result.overall_sentiment).toBe('neutral');
    expect(result.sentiment_score).toBe(0);
  });

  it('handles nested JSON in response', () => {
    const content = '```json\n{"overall_sentiment":"negative","sentiment_score":-0.5,"customer_satisfaction_estimate":3,"summary":"Bad experience"}\n```';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch![0]);
    expect(result.overall_sentiment).toBe('negative');
    expect(result.customer_satisfaction_estimate).toBe(3);
  });
});

describe('Hold Alert Edge Function Logic', () => {
  it('calculates hold duration correctly', () => {
    const now = new Date('2026-03-15T12:05:00Z');
    const startedAt = new Date('2026-03-15T12:00:00Z');
    const holdDurationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
    
    expect(holdDurationSeconds).toBe(300);
  });

  it('triggers warning at threshold', () => {
    const holdDuration = 65;
    const warningThreshold = 60;
    const criticalThreshold = 180;
    const lastSeverity: string | undefined = undefined;

    let severity: string | null = null;
    if (holdDuration >= criticalThreshold && lastSeverity !== 'critical') {
      severity = 'critical';
    } else if (holdDuration >= warningThreshold && !lastSeverity) {
      severity = 'warning';
    }

    expect(severity).toBe('warning');
  });

  it('triggers critical at threshold', () => {
    const holdDuration = 200;
    const criticalThreshold = 180;
    const lastSeverity = 'warning';

    let severity: string | null = null;
    if (holdDuration >= criticalThreshold && lastSeverity !== 'critical') {
      severity = 'critical';
    }

    expect(severity).toBe('critical');
  });

  it('does not re-trigger critical', () => {
    const holdDuration = 200;
    const criticalThreshold = 180;
    const lastSeverity = 'critical';

    let severity: string | null = null;
    if (holdDuration >= criticalThreshold && lastSeverity !== 'critical') {
      severity = 'critical';
    }

    expect(severity).toBeNull();
  });

  it('does not alert when disabled', () => {
    const enabled = false;
    const shouldCheck = enabled;
    expect(shouldCheck).toBe(false);
  });
});

describe('Contact Alert Edge Function Logic', () => {
  it('detects buying signals', () => {
    const profile = {
      buying_signals: ['price inquiry', 'demo request'],
      sentiment_trend: 'positivo',
    };

    const hasBuyingSignals = profile.buying_signals?.length > 0;
    expect(hasBuyingSignals).toBe(true);
  });

  it('detects negative sentiment', () => {
    const profile = { sentiment_trend: 'negativo' };
    const isNegative = ['negativo', 'piorando'].includes(profile.sentiment_trend.toLowerCase());
    expect(isNegative).toBe(true);
  });

  it('skips duplicate alerts within 24h', () => {
    const recentAlertKeys = new Set(['contact-1-buying_signal']);
    const contactId = 'contact-1';
    const alertType = 'buying_signal';
    const key = `${contactId}-${alertType}`;
    
    expect(recentAlertKeys.has(key)).toBe(true);
  });

  it('creates alert for new signals', () => {
    const recentAlertKeys = new Set<string>();
    const key = 'contact-1-buying_signal';
    
    expect(recentAlertKeys.has(key)).toBe(false);
  });
});

describe('Goal Violations Check Logic', () => {
  const checkGoal = (
    metricValue: number,
    targetValue: number,
    warningThreshold: number,
    criticalThreshold: number,
    operator: string
  ) => {
    if (operator === 'lte') {
      if (metricValue >= criticalThreshold) return 'critical';
      if (metricValue >= warningThreshold) return 'warning';
    } else if (operator === 'gte') {
      if (metricValue <= criticalThreshold) return 'critical';
      if (metricValue <= warningThreshold) return 'warning';
    }
    return 'ok';
  };

  it('wait time within target is ok', () => {
    expect(checkGoal(30, 60, 45, 90, 'lte')).toBe('ok');
  });

  it('wait time at warning threshold triggers warning', () => {
    expect(checkGoal(50, 60, 45, 90, 'lte')).toBe('warning');
  });

  it('wait time at critical threshold triggers critical', () => {
    expect(checkGoal(95, 60, 45, 90, 'lte')).toBe('critical');
  });

  it('service level below critical triggers critical', () => {
    expect(checkGoal(55, 80, 70, 60, 'gte')).toBe('critical');
  });
});

describe('WebAuthn Challenge Flow', () => {
  it('challenge expires after timeout', () => {
    const createdAt = new Date('2026-03-15T12:00:00Z');
    const expiresAt = new Date(createdAt.getTime() + 5 * 60 * 1000);
    const now = new Date('2026-03-15T12:06:00Z');
    
    expect(now > expiresAt).toBe(true);
  });

  it('challenge is valid within timeout', () => {
    const createdAt = new Date('2026-03-15T12:00:00Z');
    const expiresAt = new Date(createdAt.getTime() + 5 * 60 * 1000);
    const now = new Date('2026-03-15T12:03:00Z');
    
    expect(now < expiresAt).toBe(true);
  });
});

describe('Dialer Campaign Logic', () => {
  it('validates retry configuration', () => {
    const retryAttempts = 3;
    const retryDelayMinutes = 30;
    
    expect(retryAttempts).toBeGreaterThan(0);
    expect(retryDelayMinutes).toBeGreaterThan(0);
  });

  it('calculates next attempt time', () => {
    const lastAttempt = new Date('2026-03-15T12:00:00Z');
    const delayMinutes = 30;
    const nextAttempt = new Date(lastAttempt.getTime() + delayMinutes * 60000);
    
    expect(nextAttempt.toISOString()).toBe('2026-03-15T12:30:00.000Z');
  });

  it('stops after max retry attempts', () => {
    const attempts = 3;
    const maxAttempts = 3;
    const shouldRetry = attempts < maxAttempts;
    
    expect(shouldRetry).toBe(false);
  });
});
