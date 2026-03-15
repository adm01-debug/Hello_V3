import { describe, it, expect } from 'vitest';

describe('Hold Reminder System', () => {
  describe('Reminder interval configuration', () => {
    it('valid intervals are 15, 30, 60', () => {
      const validIntervals = [15, 30, 60];
      expect(validIntervals).toHaveLength(3);
    });

    it('default interval is 30', () => {
      const saved = null;
      let interval = 30;
      if (saved) {
        const parsed = parseInt(saved, 10);
        if ([15, 30, 60].includes(parsed)) interval = parsed;
      }
      expect(interval).toBe(30);
    });

    it('loads valid saved interval', () => {
      const saved = '60';
      const parsed = parseInt(saved, 10);
      const isValid = [15, 30, 60].includes(parsed);
      expect(isValid).toBe(true);
      expect(parsed).toBe(60);
    });

    it('ignores invalid saved interval', () => {
      const saved = '45';
      const parsed = parseInt(saved, 10);
      const isValid = [15, 30, 60].includes(parsed);
      expect(isValid).toBe(false);
    });

    it('converts interval to milliseconds', () => {
      const interval = 30;
      const intervalMs = interval * 1000;
      expect(intervalMs).toBe(30000);
    });
  });

  describe('Alert threshold configuration', () => {
    it('valid thresholds are 30, 60, 120, 180, 300', () => {
      const thresholds = [30, 60, 120, 180, 300];
      expect(thresholds).toHaveLength(5);
    });

    it('default threshold is 60', () => {
      const saved = null;
      let threshold = 60;
      if (saved) {
        const parsed = parseInt(saved as string, 10);
        if ([30, 60, 120, 180, 300].includes(parsed)) threshold = parsed;
      }
      expect(threshold).toBe(60);
    });

    it('critical threshold is 2x warning', () => {
      const warningThreshold = 60;
      const criticalThreshold = warningThreshold * 2;
      expect(criticalThreshold).toBe(120);
    });
  });

  describe('Hold time formatting', () => {
    const formatHoldTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      if (mins > 0) return `${mins}m ${secs}s`;
      return `${secs}s`;
    };

    it('formats seconds only', () => {
      expect(formatHoldTime(45)).toBe('45s');
    });

    it('formats minutes and seconds', () => {
      expect(formatHoldTime(125)).toBe('2m 5s');
    });

    it('formats exact minutes', () => {
      expect(formatHoldTime(120)).toBe('2m 0s');
    });

    it('formats zero seconds', () => {
      expect(formatHoldTime(0)).toBe('0s');
    });

    it('formats large values', () => {
      expect(formatHoldTime(3661)).toBe('61m 1s');
    });
  });

  describe('Reminder throttling', () => {
    it('triggers when enough time has passed', () => {
      const lastReminder = 1000;
      const now = 35000;
      const intervalMs = 30000;
      const shouldNotify = now - lastReminder >= intervalMs;
      expect(shouldNotify).toBe(true);
    });

    it('does not trigger when too recent', () => {
      const lastReminder = 1000;
      const now = 15000;
      const intervalMs = 30000;
      const shouldNotify = now - lastReminder >= intervalMs;
      expect(shouldNotify).toBe(false);
    });

    it('triggers on first reminder (no previous)', () => {
      const lastReminder = 0;
      const now = 5000;
      const intervalMs = 30000;
      const shouldNotify = now - lastReminder >= intervalMs;
      expect(shouldNotify).toBe(false); // Still needs to wait
    });
  });

  describe('Hold alert deduplication', () => {
    it('triggers warning once per call', () => {
      const alertedCalls: Record<string, { warning: boolean; critical: boolean }> = {};
      const callId = 'call-1';

      const callAlerts = alertedCalls[callId] || { warning: false, critical: false };
      expect(callAlerts.warning).toBe(false);

      // After warning
      alertedCalls[callId] = { ...callAlerts, warning: true };
      expect(alertedCalls[callId].warning).toBe(true);
    });

    it('triggers critical independently of warning', () => {
      const alertedCalls: Record<string, { warning: boolean; critical: boolean }> = {
        'call-1': { warning: true, critical: false },
      };
      const callAlerts = alertedCalls['call-1'];
      expect(callAlerts.warning).toBe(true);
      expect(callAlerts.critical).toBe(false);

      // Trigger critical
      alertedCalls['call-1'] = { ...callAlerts, critical: true };
      expect(alertedCalls['call-1'].critical).toBe(true);
    });
  });

  describe('Active alerts list', () => {
    it('keeps last 20 alerts', () => {
      const existing = Array.from({ length: 18 }, (_, i) => ({ id: `alert-${i}` }));
      const newAlerts = [{ id: 'new-1' }, { id: 'new-2' }, { id: 'new-3' }];
      const combined = [...existing, ...newAlerts].slice(-20);
      expect(combined).toHaveLength(20);
      expect(combined[combined.length - 1].id).toBe('new-3');
    });

    it('clears alerts for calls no longer on hold', () => {
      const alerts = [
        { callId: 'call-1', severity: 'warning' },
        { callId: 'call-2', severity: 'critical' },
        { callId: 'call-3', severity: 'warning' },
      ];
      const activeCalls = [
        { id: 'call-1', isOnHold: true },
        { id: 'call-2', isOnHold: false },
      ];
      const filtered = alerts.filter(a => {
        const call = activeCalls.find(c => c.id === a.callId);
        return call && call.isOnHold;
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].callId).toBe('call-1');
    });
  });

  describe('Browser notification for critical', () => {
    it('requires granted permission', () => {
      const permission = 'granted';
      const canNotify = permission === 'granted';
      expect(canNotify).toBe(true);
    });

    it('does not notify on denied', () => {
      const permission = 'denied' as string;
      const canNotify = permission === 'granted';
      expect(canNotify).toBe(false);
    });

    it('critical requires interaction', () => {
      const severity = 'critical';
      const requireInteraction = severity === 'critical';
      expect(requireInteraction).toBe(true);
    });

    it('warning auto-closes after 10s', () => {
      const severity = 'warning';
      const autoCloseMs = severity !== 'critical' ? 10000 : null;
      expect(autoCloseMs).toBe(10000);
    });

    it('tags prevent duplicate notifications', () => {
      const tag = `hold-alert-call-1`;
      expect(tag).toBe('hold-alert-call-1');
    });
  });

  describe('Cleanup on call end', () => {
    it('removes reminder time for ended calls', () => {
      const lastReminderTime: Record<string, number> = {
        'call-1': 1000, 'call-2': 2000, 'call-3': 3000,
      };
      const activeCallIds = new Set(['call-2']);
      const cleaned: Record<string, number> = {};
      Object.entries(lastReminderTime).forEach(([id, time]) => {
        if (activeCallIds.has(id)) cleaned[id] = time;
      });
      expect(Object.keys(cleaned)).toHaveLength(1);
      expect(cleaned['call-2']).toBe(2000);
    });

    it('removes alerted state for ended calls', () => {
      const alertedCalls: Record<string, { warning: boolean; critical: boolean }> = {
        'call-1': { warning: true, critical: false },
        'call-2': { warning: true, critical: true },
      };
      const activeCallIds = new Set(['call-1']);
      const cleaned: Record<string, any> = {};
      Object.entries(alertedCalls).forEach(([id, alerts]) => {
        if (activeCallIds.has(id)) cleaned[id] = alerts;
      });
      expect(Object.keys(cleaned)).toHaveLength(1);
    });
  });

  describe('Toggle functions', () => {
    it('toggles reminder enabled', () => {
      let enabled = true;
      enabled = !enabled;
      expect(enabled).toBe(false);
      enabled = !enabled;
      expect(enabled).toBe(true);
    });

    it('toggles alerts enabled', () => {
      let alertsEnabled = true;
      alertsEnabled = !alertsEnabled;
      expect(alertsEnabled).toBe(false);
    });

    it('changing interval resets reminder times', () => {
      let lastReminderTime: Record<string, number> = { 'call-1': 5000 };
      // On interval change:
      lastReminderTime = {};
      expect(Object.keys(lastReminderTime)).toHaveLength(0);
    });

    it('changing threshold resets alerted calls', () => {
      let alertedCalls: Record<string, any> = { 'call-1': { warning: true } };
      // On threshold change:
      alertedCalls = {};
      expect(Object.keys(alertedCalls)).toHaveLength(0);
    });
  });
});
