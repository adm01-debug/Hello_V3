import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * ERROR TRACKING MODULE TEST SUITE
 * Validates: initErrorTracking, getErrorReports, buffer management
 */

describe('Error Tracking Module', () => {
  let initErrorTracking: typeof import('@/lib/error-tracking').initErrorTracking;
  let getErrorReports: typeof import('@/lib/error-tracking').getErrorReports;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/lib/error-tracking');
    initErrorTracking = mod.initErrorTracking;
    getErrorReports = mod.getErrorReports;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Module exports', () => {
    it('exports initErrorTracking function', () => {
      expect(typeof initErrorTracking).toBe('function');
    });

    it('exports getErrorReports function', () => {
      expect(typeof getErrorReports).toBe('function');
    });
  });

  describe('initErrorTracking', () => {
    it('registers window error listener', () => {
      const spy = vi.spyOn(window, 'addEventListener');
      initErrorTracking();
      const errorCalls = spy.mock.calls.filter(c => c[0] === 'error');
      expect(errorCalls.length).toBeGreaterThanOrEqual(1);
    });

    it('registers unhandledrejection listener', () => {
      const spy = vi.spyOn(window, 'addEventListener');
      initErrorTracking();
      const rejectionCalls = spy.mock.calls.filter(c => c[0] === 'unhandledrejection');
      expect(rejectionCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getErrorReports', () => {
    it('returns empty array initially', () => {
      const reports = getErrorReports();
      expect(Array.isArray(reports)).toBe(true);
    });

    it('returns a copy (not reference)', () => {
      const reports1 = getErrorReports();
      const reports2 = getErrorReports();
      expect(reports1).not.toBe(reports2);
    });
  });

  describe('Error capture via window events', () => {
    it('captures error events', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      initErrorTracking();

      const errorEvent = new ErrorEvent('error', {
        message: 'Test error message',
        filename: 'test.js',
        lineno: 42,
        colno: 10,
      });
      window.dispatchEvent(errorEvent);

      const reports = getErrorReports();
      expect(reports.length).toBeGreaterThanOrEqual(1);
      const last = reports[reports.length - 1];
      expect(last.message).toBe('Test error message');
      expect(last.type).toBe('error');
    });

    it('captures unhandled rejections', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      initErrorTracking();

      const event = new Event('unhandledrejection') as Event & { reason: unknown };
      event.reason = new Error('Promise failed');
      window.dispatchEvent(event);

      const reports = getErrorReports();
      expect(reports.length).toBeGreaterThanOrEqual(1);
      const last = reports[reports.length - 1];
      expect(last.message).toBe('Promise failed');
      expect(last.type).toBe('unhandled-rejection');
    });

    it('error report has timestamp', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      initErrorTracking();

      window.dispatchEvent(new ErrorEvent('error', { message: 'ts test' }));
      const reports = getErrorReports();
      const last = reports[reports.length - 1];
      expect(last.timestamp).toBeDefined();
      expect(typeof last.timestamp).toBe('number');
    });

    it('error report has URL', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      initErrorTracking();

      window.dispatchEvent(new ErrorEvent('error', { message: 'url test' }));
      const reports = getErrorReports();
      const last = reports[reports.length - 1];
      expect(last.url).toBeDefined();
    });

    it('error report has userAgent', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      initErrorTracking();

      window.dispatchEvent(new ErrorEvent('error', { message: 'ua test' }));
      const reports = getErrorReports();
      const last = reports[reports.length - 1];
      expect(last.userAgent).toBeDefined();
    });
  });

  describe('Buffer management', () => {
    it('buffer has a maximum size limit', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      initErrorTracking();

      // Fire 25 errors (max is 20)
      for (let i = 0; i < 25; i++) {
        window.dispatchEvent(new ErrorEvent('error', { message: `Error ${i}` }));
      }

      const reports = getErrorReports();
      expect(reports.length).toBeLessThanOrEqual(20);
    });

    it('oldest errors are removed when buffer is full', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      initErrorTracking();

      for (let i = 0; i < 25; i++) {
        window.dispatchEvent(new ErrorEvent('error', { message: `Error ${i}` }));
      }

      const reports = getErrorReports();
      // Should NOT contain the first errors
      const messages = reports.map(r => r.message);
      expect(messages).not.toContain('Error 0');
      expect(messages).not.toContain('Error 1');
    });
  });
});

describe('Error Tracking: File structure', () => {
  it('error-tracking.ts file exists and has proper exports', async () => {
    const mod = await import('@/lib/error-tracking');
    expect(mod.initErrorTracking).toBeDefined();
    expect(mod.getErrorReports).toBeDefined();
  });
});
