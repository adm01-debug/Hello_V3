export interface BusinessMetric {
  name: string;
  value: number;
  period: 'daily' | 'weekly' | 'monthly';
  timestamp: number;
  metadata?: Record<string, any>;
}

export class BusinessMetrics {
  private metrics: Map<string, BusinessMetric[]> = new Map();

  trackRevenue(amount: number, currency: string = 'USD') {
    this.record({
      name: 'revenue',
      value: amount,
      period: 'daily',
      timestamp: Date.now(),
      metadata: { currency },
    });
  }

  trackUserGrowth(newUsers: number) {
    this.record({
      name: 'user_growth',
      value: newUsers,
      period: 'daily',
      timestamp: Date.now(),
    });
  }

  trackChurnRate(rate: number) {
    this.record({
      name: 'churn_rate',
      value: rate,
      period: 'monthly',
      timestamp: Date.now(),
    });
  }

  trackActiveUsers(count: number, type: 'daily' | 'weekly' | 'monthly') {
    this.record({
      name: `active_users_${type}`,
      value: count,
      period: type,
      timestamp: Date.now(),
    });
  }

  trackConversionRate(rate: number, funnel: string) {
    this.record({
      name: 'conversion_rate',
      value: rate,
      period: 'daily',
      timestamp: Date.now(),
      metadata: { funnel },
    });
  }

  private record(metric: BusinessMetric) {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }
    this.metrics.get(metric.name)!.push(metric);
  }

  getMetric(name: string, period?: 'daily' | 'weekly' | 'monthly'): BusinessMetric[] {
    const metrics = this.metrics.get(name) || [];
    if (period) {
      return metrics.filter(m => m.period === period);
    }
    return metrics;
  }

  aggregateByPeriod(name: string, period: 'daily' | 'weekly' | 'monthly'): number {
    const metrics = this.getMetric(name, period);
    return metrics.reduce((sum, m) => sum + m.value, 0);
  }
}

export const businessMetrics = new BusinessMetrics();
