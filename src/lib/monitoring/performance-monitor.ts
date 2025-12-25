export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  tags?: Record<string, string>;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.setupObservers();
  }

  private setupObservers() {
    if (typeof window === 'undefined') return;

    this.observeResourceTiming();
    this.observeNavigationTiming();
    this.observeLongTasks();
  }

  private observeResourceTiming() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming;
        this.recordMetric({
          name: 'resource.load',
          value: resource.duration,
          unit: 'ms',
          timestamp: Date.now(),
          tags: {
            resource: resource.name,
            type: resource.initiatorType,
          },
        });
      }
    });
    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }

  private observeNavigationTiming() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const navigation = entry as PerformanceNavigationTiming;
        
        this.recordMetric({
          name: 'navigation.domContentLoaded',
          value: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          unit: 'ms',
          timestamp: Date.now(),
        });

        this.recordMetric({
          name: 'navigation.load',
          value: navigation.loadEventEnd - navigation.loadEventStart,
          unit: 'ms',
          timestamp: Date.now(),
        });
      }
    });
    observer.observe({ entryTypes: ['navigation'] });
    this.observers.push(observer);
  }

  private observeLongTasks() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: 'task.long',
            value: entry.duration,
            unit: 'ms',
            timestamp: Date.now(),
          });
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (e) {
      // longtask not supported
    }
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    this.recordMetric({
      name: `function.${name}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
    });
    
    return result;
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    this.recordMetric({
      name: `async.${name}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
    });
    
    return result;
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clearMetrics() {
    this.metrics = [];
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();
