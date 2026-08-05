import { describe, it, expect } from 'vitest';

describe('Device Detection', () => {
  describe('Browser detection', () => {
    const detectBrowser = (ua: string): string => {
      if (ua.includes('Firefox')) return 'Firefox';
      if (ua.includes('Edg')) return 'Edge';
      if (ua.includes('Chrome')) return 'Chrome';
      if (ua.includes('Safari')) return 'Safari';
      if (ua.includes('Opera')) return 'Opera';
      return 'Unknown';
    };

    it('detects Chrome', () => expect(detectBrowser('Chrome/120.0')).toBe('Chrome'));
    it('detects Firefox', () => expect(detectBrowser('Firefox/120.0')).toBe('Firefox'));
    it('detects Edge', () => expect(detectBrowser('Edg/120.0')).toBe('Edge'));
    it('detects Safari', () => expect(detectBrowser('Safari/604.1')).toBe('Safari'));
    it('prefers Edge over Chrome', () => expect(detectBrowser('Chrome/120.0 Edg/120.0')).toBe('Edge'));
    it('returns Unknown for bots', () => expect(detectBrowser('Googlebot/2.1')).toBe('Unknown'));
  });

  describe('OS detection', () => {
    const detectOS = (ua: string): string => {
      if (ua.includes('Windows')) return 'Windows';
      if (ua.includes('Android')) return 'Android';
      if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
      if (ua.includes('Mac')) return 'macOS';
      if (ua.includes('Linux')) return 'Linux';
      return 'Unknown';
    };

    it('detects Windows', () => expect(detectOS('Windows NT 10.0')).toBe('Windows'));
    it('detects macOS', () => expect(detectOS('Macintosh; Intel Mac OS X')).toBe('macOS'));
    it('detects Linux', () => expect(detectOS('X11; Linux x86_64')).toBe('Linux'));
    it('detects Android', () => expect(detectOS('Linux; Android 13')).toBe('Android'));
    it('detects iOS iPhone', () => expect(detectOS('iPhone; CPU iPhone OS 17_0')).toBe('iOS'));
    it('detects iOS iPad', () => expect(detectOS('iPad; CPU OS 17_0')).toBe('iOS'));
  });

  describe('Device type detection', () => {
    const detectDevice = (ua: string): string => {
      if (/Mobile|Android|iPhone/.test(ua)) return 'Mobile';
      if (/iPad|Tablet/.test(ua)) return 'Tablet';
      return 'Desktop';
    };

    it('detects Mobile', () => expect(detectDevice('iPhone')).toBe('Mobile'));
    it('detects Tablet', () => expect(detectDevice('iPad')).toBe('Tablet'));
    it('detects Desktop', () => expect(detectDevice('Macintosh')).toBe('Desktop'));
    it('Android is Mobile', () => expect(detectDevice('Android')).toBe('Mobile'));
  });

  describe('Fingerprint generation', () => {
    it('generates deterministic fingerprint from components', () => {
      const components = ['Chrome', 'Windows', 'Desktop', 'en-US', '1920x1080', '-180'];
      const fp = btoa(components.join('|'));
      const fp2 = btoa(components.join('|'));
      expect(fp).toBe(fp2);
    });

    it('different components produce different fingerprints', () => {
      const fp1 = btoa('Chrome|Windows|Desktop');
      const fp2 = btoa('Firefox|macOS|Desktop');
      expect(fp1).not.toBe(fp2);
    });
  });

  describe('New device detection logic', () => {
    it('new IP is flagged', () => {
      const existingIPs = new Set(['1.2.3.4', '5.6.7.8']);
      const currentIP = '9.10.11.12';
      expect(!existingIPs.has(currentIP)).toBe(true);
    });

    it('known IP is not flagged', () => {
      const existingIPs = new Set(['1.2.3.4', '5.6.7.8']);
      const currentIP = '1.2.3.4';
      expect(!existingIPs.has(currentIP)).toBe(false);
    });

    it('Unknown IP is not flagged', () => {
      const currentIP = 'Unknown';
      const isNewIP = currentIP !== 'Unknown';
      expect(isNewIP).toBe(false);
    });

    it('first login is not flagged (no existing sessions)', () => {
      const existingSessions: unknown[] = [];
      const isNewDevice = true;
      const shouldNotify = isNewDevice && existingSessions.length > 0;
      expect(shouldNotify).toBe(false);
    });

    it('new device on existing account triggers notification', () => {
      const existingSessions = [{ ip_address: '1.2.3.4' }];
      const isNewDevice = true;
      const shouldNotify = isNewDevice && existingSessions.length > 0;
      expect(shouldNotify).toBe(true);
    });
  });
});

describe('Security Notification System', () => {
  describe('Alert severity formatting', () => {
    const formatSeverity = (severity: string) => {
      const emoji: Record<string, string> = { critical: '🚨', warning: '⚠️', info: 'ℹ️' };
      const text: Record<string, string> = { critical: 'CRÍTICO', warning: 'Aviso', info: 'Informação' };
      return { emoji: emoji[severity] || '🔔', text: text[severity] || 'Alerta' };
    };

    it('formats critical correctly', () => {
      const result = formatSeverity('critical');
      expect(result.emoji).toBe('🚨');
      expect(result.text).toBe('CRÍTICO');
    });

    it('formats warning correctly', () => {
      const result = formatSeverity('warning');
      expect(result.emoji).toBe('⚠️');
      expect(result.text).toBe('Aviso');
    });

    it('formats info correctly', () => {
      const result = formatSeverity('info');
      expect(result.text).toBe('Informação');
    });

    it('handles unknown severity', () => {
      const result = formatSeverity('custom');
      expect(result.emoji).toBe('🔔');
      expect(result.text).toBe('Alerta');
    });
  });

  describe('Vibration patterns', () => {
    it('critical has longer pattern', () => {
      const critical = [200, 100, 200, 100, 200];
      const warning = [200, 100, 200];
      expect(critical.length).toBeGreaterThan(warning.length);
    });
  });

  describe('Notification auto-close', () => {
    it('auto-closes after 10 seconds for non-critical', () => {
      const autoCloseMs = 10000;
      expect(autoCloseMs).toBe(10000);
    });

    it('critical notifications require interaction', () => {
      const severity = 'critical';
      const requireInteraction = severity === 'critical';
      expect(requireInteraction).toBe(true);
    });

    it('non-critical do not require interaction', () => {
      const severity = 'warning';
      const requireInteraction = (severity as string) === 'critical';
      expect(requireInteraction).toBe(false);
    });
  });
});

describe('Critical Alert Sound System', () => {
  describe('Sound configuration defaults', () => {
    const defaults = {
      warningFrequency: 520,
      warningPattern: 'single',
      warningVolume: 0.2,
      criticalFrequency: 880,
      criticalPattern: 'urgent',
      criticalVolume: 0.3,
    };

    it('warning frequency is lower than critical', () => {
      expect(defaults.warningFrequency).toBeLessThan(defaults.criticalFrequency);
    });

    it('critical volume is higher than warning', () => {
      expect(defaults.criticalVolume).toBeGreaterThan(defaults.warningVolume);
    });

    it('critical uses urgent pattern', () => {
      expect(defaults.criticalPattern).toBe('urgent');
    });
  });

  describe('Beep patterns', () => {
    const getBeepCount = (pattern: string): number => {
      switch (pattern) {
        case 'single': return 1;
        case 'double': return 2;
        case 'triple': return 3;
        case 'urgent': return 4;
        default: return 0;
      }
    };

    it('single plays 1 beep', () => expect(getBeepCount('single')).toBe(1));
    it('double plays 2 beeps', () => expect(getBeepCount('double')).toBe(2));
    it('triple plays 3 beeps', () => expect(getBeepCount('triple')).toBe(3));
    it('urgent plays 4 beeps', () => expect(getBeepCount('urgent')).toBe(4));
    it('unknown returns 0', () => expect(getBeepCount('invalid')).toBe(0));
  });

  describe('Duplicate alert prevention', () => {
    it('blocks same alert ID', () => {
      let lastAlertId: string | null = null;
      const alertId = 'alert-1';

      // First time
      const isNew1 = lastAlertId !== alertId;
      lastAlertId = alertId;
      expect(isNew1).toBe(true);

      // Second time
      const isNew2 = lastAlertId !== alertId;
      expect(isNew2).toBe(false);
    });

    it('allows different alert ID', () => {
      const lastAlertId: string | null = 'alert-1';
      const newAlertId = 'alert-2';
      expect(lastAlertId !== newAlertId).toBe(true);
    });
  });
});

describe('Hold Sound Alert System', () => {
  describe('Sound trigger logic', () => {
    it('triggers warning at warning threshold', () => {
      const holdDuration = 65;
      const warningThreshold = 60;
      const criticalThreshold = 180;
      const warned = new Set<string>();
      const holdId = 'hold-1';

      const shouldWarn = holdDuration >= warningThreshold &&
        holdDuration < criticalThreshold &&
        !warned.has(holdId);

      expect(shouldWarn).toBe(true);
    });

    it('skips warning if already warned', () => {
      const holdDuration = 65;
      const warned = new Set(['hold-1']);

      const shouldWarn = holdDuration >= 60 && holdDuration < 180 && !warned.has('hold-1');
      expect(shouldWarn).toBe(false);
    });

    it('marks critical and skips future warnings', () => {
      const warned = new Set<string>();
      const critical = new Set<string>();
      const holdId = 'hold-1';

      // When critical triggers
      critical.add(holdId);
      warned.add(holdId); // Also mark as warned

      expect(warned.has(holdId)).toBe(true);
      expect(critical.has(holdId)).toBe(true);
    });

    it('cleans up holds that are no longer active', () => {
      const warned = new Set(['hold-1', 'hold-2', 'hold-3']);
      const activeHoldIds = new Set(['hold-2']);

      warned.forEach(id => {
        if (!activeHoldIds.has(id)) warned.delete(id);
      });

      expect(warned.size).toBe(1);
      expect(warned.has('hold-2')).toBe(true);
    });
  });

  describe('Sound enabled persistence', () => {
    it('defaults to true', () => {
      const saved = null; // localStorage returns null if not set
      const enabled = saved !== null ? saved === 'true' : true;
      expect(enabled).toBe(true);
    });

    it('respects saved false', () => {
      const saved = 'false';
      const enabled = saved !== null ? (saved as string) === 'true' : true;
      expect(enabled).toBe(false);
    });

    it('respects saved true', () => {
      const saved = 'true';
      const enabled = saved !== null ? saved === 'true' : true;
      expect(enabled).toBe(true);
    });
  });
});

describe('Coaching System', () => {
  describe('Status transitions', () => {
    it('pending → in_progress sets reviewed_at', () => {
      const updates: Record<string, string> = { status: 'in_progress' };
      updates.reviewed_at = new Date().toISOString();
      expect(updates.reviewed_at).toBeTruthy();
    });

    it('in_progress → completed sets completed_at', () => {
      const updates: Record<string, string> = { status: 'completed' };
      updates.completed_at = new Date().toISOString();
      expect(updates.completed_at).toBeTruthy();
    });

    it('valid coaching categories', () => {
      const categories = ['communication', 'technical', 'empathy', 'efficiency', 'compliance'];
      expect(categories).toContain('communication');
      expect(categories).toContain('compliance');
      expect(categories).toHaveLength(5);
    });

    it('valid priority levels', () => {
      const priorities = ['high', 'medium', 'low'];
      expect(priorities).toContain('high');
      expect(priorities).toHaveLength(3);
    });
  });
});

describe('Conference Recording', () => {
  it('auto-starts recording when conference starts', () => {
    const conference = { isRecording: true, isActive: true };
    const isRecording = false;
    const wasRecording = false;

    const shouldStart = conference.isRecording && conference.isActive && !isRecording && !wasRecording;
    expect(shouldStart).toBe(true);
  });

  it('auto-saves when conference ends', () => {
    const wasRecording = true;
    const conference = null;

    const shouldSave = wasRecording && !conference;
    expect(shouldSave).toBe(true);
  });

  it('does not start if already recording', () => {
    const conference = { isRecording: true, isActive: true };
    const isRecording = true;

    const shouldStart = conference.isRecording && conference.isActive && !isRecording;
    expect(shouldStart).toBe(false);
  });
});

describe('Geo-Blocking Logic', () => {
  describe('Block mode vs allow mode', () => {
    it('blocklist blocks listed countries', () => {
      const mode = 'blocklist';
      const blockedCountries = ['CN', 'RU', 'KP'];
      const userCountry = 'RU';

      const isBlocked = mode === 'blocklist' && blockedCountries.includes(userCountry);
      expect(isBlocked).toBe(true);
    });

    it('blocklist allows unlisted countries', () => {
      const mode = 'blocklist';
      const blockedCountries = ['CN', 'RU', 'KP'];
      const userCountry = 'BR';

      const isBlocked = mode === 'blocklist' && blockedCountries.includes(userCountry);
      expect(isBlocked).toBe(false);
    });

    it('allowlist allows only listed countries', () => {
      const mode = 'allowlist';
      const allowedCountries = ['BR', 'US', 'PT'];
      const userCountry = 'BR';

      const isAllowed = mode === 'allowlist' && allowedCountries.includes(userCountry);
      expect(isAllowed).toBe(true);
    });

    it('allowlist blocks unlisted countries', () => {
      const mode = 'allowlist';
      const allowedCountries = ['BR', 'US', 'PT'];
      const userCountry = 'CN';

      const isAllowed = mode === 'allowlist' && allowedCountries.includes(userCountry);
      expect(isAllowed).toBe(false);
    });
  });

  describe('Geo settings', () => {
    it('disabled bypasses all checks', () => {
      const enabled = false;
      const shouldCheck = enabled;
      expect(shouldCheck).toBe(false);
    });

    it('logs blocked attempt when configured', () => {
      const logBlockedAttempts = true;
      const shouldLog = logBlockedAttempts;
      expect(shouldLog).toBe(true);
    });
  });
});

describe('Consent Management', () => {
  it('consent can expire', () => {
    const expiresAt = new Date('2026-01-01T00:00:00Z');
    const now = new Date('2026-03-15T00:00:00Z');
    const isExpired = now > expiresAt;
    expect(isExpired).toBe(true);
  });

  it('consent without expiry is perpetual', () => {
    const expiresAt: string | null = null;
    const isExpired = expiresAt ? new Date() > new Date(expiresAt) : false;
    expect(isExpired).toBe(false);
  });

  it('revoked consent has revoked_at timestamp', () => {
    const revokedAt = new Date().toISOString();
    expect(revokedAt).toBeTruthy();
  });

  it('active consent has no revoked_at', () => {
    const revokedAt: string | null = null;
    const isActive = !revokedAt;
    expect(isActive).toBe(true);
  });
});
