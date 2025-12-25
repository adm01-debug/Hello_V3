export interface WebVitals {
  LCP: number;
  FID: number;
  CLS: number;
  TTFB: number;
  FCP: number;
}

export class WebVitalsMonitor {
  private metrics: Partial<WebVitals> = {};

  constructor() {
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeTTFB();
    this.observeFCP();
  }

  private observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  private observeFID() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        this.metrics.FID = entry.processingStart - entry.startTime;
      });
    });
    observer.observe({ entryTypes: ['first-input'] });
  }

  private observeCLS() {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.metrics.CLS = clsValue;
        }
      }
    });
    observer.observe({ entryTypes: ['layout-shift'] });
  }

  private observeTTFB() {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as any;
    if (navigationEntry) {
      this.metrics.TTFB = navigationEntry.responseStart - navigationEntry.requestStart;
    }
  }

  private observeFCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.FCP = entry.startTime;
        }
      });
    });
    observer.observe({ entryTypes: ['paint'] });
  }

  getMetrics(): WebVitals {
    return {
      LCP: this.metrics.LCP || 0,
      FID: this.metrics.FID || 0,
      CLS: this.metrics.CLS || 0,
      TTFB: this.metrics.TTFB || 0,
      FCP: this.metrics.FCP || 0,
    };
  }

  getScore(): { good: number; needsImprovement: number; poor: number } {
    const metrics = this.getMetrics();
    let good = 0, needsImprovement = 0, poor = 0;

    if (metrics.LCP <= 2500) good++; 
    else if (metrics.LCP <= 4000) needsImprovement++; 
    else poor++;

    if (metrics.FID <= 100) good++; 
    else if (metrics.FID <= 300) needsImprovement++; 
    else poor++;

    if (metrics.CLS <= 0.1) good++; 
    else if (metrics.CLS <= 0.25) needsImprovement++; 
    else poor++;

    return { good, needsImprovement, poor };
  }

  sendToAnalytics() {
    const metrics = this.getMetrics();
    console.log('Web Vitals:', metrics);
  }
}

export const webVitalsMonitor = new WebVitalsMonitor();
