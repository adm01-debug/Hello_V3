export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export class CustomMetrics {
  private metrics: Metric[] = [];

  counter(name: string, value: number = 1, tags?: Record<string, string>) {
    this.record({ name: `counter.${name}`, value, timestamp: Date.now(), tags });
  }

  gauge(name: string, value: number, tags?: Record<string, string>) {
    this.record({ name: `gauge.${name}`, value, timestamp: Date.now(), tags });
  }

  histogram(name: string, value: number, tags?: Record<string, string>) {
    this.record({ name: `histogram.${name}`, value, timestamp: Date.now(), tags });
  }

  timing(name: string, duration: number, tags?: Record<string, string>) {
    this.record({ name: `timing.${name}`, value: duration, timestamp: Date.now(), tags });
  }

  private record(metric: Metric) {
    this.metrics.push(metric);
    
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }
  }

  getMetrics(name?: string): Metric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  clear() {
    this.metrics = [];
  }
}

export const customMetrics = new CustomMetrics();
