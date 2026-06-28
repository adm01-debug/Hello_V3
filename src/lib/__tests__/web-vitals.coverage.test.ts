import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Capture observer instances so we can feed them fake entries.
interface CapturedObserver {
  callback: (list: { getEntries: () => unknown[] }) => void;
  type?: string;
}
const observers: CapturedObserver[] = [];

class MockPerformanceObserver {
  callback: CapturedObserver['callback'];
  constructor(cb: CapturedObserver['callback']) {
    this.callback = cb;
  }
  observe(opts: { type: string; buffered?: boolean }) {
    observers.push({ callback: this.callback, type: opts.type });
  }
  disconnect() {}
}

function emit(type: string, entries: unknown[]) {
  for (const o of observers.filter((x) => x.type === type)) {
    o.callback({ getEntries: () => entries });
  }
}

import {
  getWebVitals,
  getLatestVitals,
  initWebVitals,
} from '../web-vitals';

describe('web-vitals', () => {
  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal('PerformanceObserver', MockPerformanceObserver as unknown as typeof PerformanceObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('getWebVitals returns an array', () => {
    expect(Array.isArray(getWebVitals())).toBe(true);
  });

  it('initWebVitals registers observers and records metrics across ratings', () => {
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
      { type: 'navigate', responseStart: 1000, requestStart: 100 } as unknown as PerformanceNavigationTiming,
    ]);

    initWebVitals();

    // FCP / LCP (paint observers)
    emit('paint', [{ startTime: 1500 }]);
    emit('largest-contentful-paint', [{ startTime: 5000 }]); // poor LCP

    // CLS — first with hadRecentInput (skipped), then a real shift
    emit('layout-shift', [
      { hadRecentInput: true, value: 1 },
      { hadRecentInput: false, value: 0.05 },
    ]);

    // INP event
    emit('event', [{ duration: 250 }]); // needs-improvement

    // FID first-input
    emit('first-input', [{ startTime: 10, processingStart: 60 }]);

    const vitals = getWebVitals();
    const names = vitals.map((v) => v.name);
    expect(names).toContain('FCP');
    expect(names).toContain('LCP');
    expect(names).toContain('CLS');
    expect(names).toContain('INP');
    expect(names).toContain('TTFB');
    expect(names).toContain('FID');

    const latest = getLatestVitals();
    expect(latest.LCP?.rating).toBe('poor');
    expect(latest.INP?.rating).toBe('needs-improvement');
    expect(latest.FCP?.rating).toBe('good');
  });

  it('handles empty paint entries without throwing', () => {
    initWebVitals();
    expect(() => emit('paint', [])).not.toThrow();
  });

  it('initWebVitals early-returns when PerformanceObserver is undefined', () => {
    vi.stubGlobal('PerformanceObserver', undefined);
    expect(() => initWebVitals()).not.toThrow();
  });
});
