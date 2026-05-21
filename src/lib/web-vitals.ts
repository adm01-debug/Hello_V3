/**
 * Web Vitals tracking — captures Core Web Vitals (LCP, FID, CLS, FCP, TTFB, INP)
 * and stores them for the observability dashboard.
 */

export interface WebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  navigationType?: string;
}

const VITALS_BUFFER: WebVitalMetric[] = [];
const MAX_BUFFER = 100;

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    TTFB: [800, 1800],
    INP: [200, 500],
  };
  const [good, poor] = thresholds[name] || [0, 0];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function addMetric(metric: WebVitalMetric): void {
  if (VITALS_BUFFER.length >= MAX_BUFFER) VITALS_BUFFER.shift();
  VITALS_BUFFER.push(metric);
}

export function getWebVitals(): ReadonlyArray<WebVitalMetric> {
  return [...VITALS_BUFFER];
}

export function getLatestVitals(): Record<string, WebVitalMetric | undefined> {
  const latest: Record<string, WebVitalMetric | undefined> = {};
  for (const metric of VITALS_BUFFER) {
    if (!latest[metric.name] || metric.timestamp > (latest[metric.name]?.timestamp ?? 0)) {
      latest[metric.name] = metric;
    }
  }
  return latest;
}

function observePaint(entryType: string, name: string, vitalName: 'FCP' | 'LCP'): void {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      // For 'paint' type, both 'first-paint' and 'first-contentful-paint' fire — must filter
      // by name. For 'largest-contentful-paint', any entry counts; the last is the most recent.
      const entry = name
        ? entries.filter((e) => e.name === name).pop()
        : entries[entries.length - 1];
      if (entry) {
        const value = entry.startTime;
        addMetric({
          name: vitalName,
          value,
          rating: getRating(vitalName, value),
          timestamp: Date.now(),
        });
      }
    });
    observer.observe({ type: entryType, buffered: true });
  } catch {
    // Observer not supported
  }
}

function observeCLS(): void {
  try {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value ?? 0;
        }
      }
      addMetric({
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
        timestamp: Date.now(),
      });
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch {
    // Observer not supported
  }
}

function observeINP(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const value = entry.duration;
        addMetric({
          name: 'INP',
          value,
          rating: getRating('INP', value),
          timestamp: Date.now(),
        });
      }
    });
    observer.observe({ type: 'event', buffered: true });
  } catch {
    // Observer not supported
  }
}

export function initWebVitals(): void {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;

  // FCP
  observePaint('paint', 'first-contentful-paint', 'FCP');

  // LCP
  observePaint('largest-contentful-paint', '', 'LCP');

  // CLS
  observeCLS();

  // INP
  observeINP();

  // TTFB — from navigation timing
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) {
      const ttfb = nav.responseStart - nav.requestStart;
      addMetric({
        name: 'TTFB',
        value: ttfb,
        rating: getRating('TTFB', ttfb),
        timestamp: Date.now(),
        navigationType: nav.type,
      });
    }
  } catch {
    // Not supported
  }

  // FID — from first-input
  try {
    const observer = new PerformanceObserver((list) => {
      const entry = list.getEntries()[0] as PerformanceEntry & { processingStart?: number };
      if (entry && entry.processingStart) {
        const value = entry.processingStart - entry.startTime;
        addMetric({
          name: 'FID',
          value,
          rating: getRating('FID', value),
          timestamp: Date.now(),
        });
      }
    });
    observer.observe({ type: 'first-input', buffered: true });
  } catch {
    // Not supported
  }
}
