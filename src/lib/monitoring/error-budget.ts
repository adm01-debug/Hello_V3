export interface ErrorBudget {
  slo: number;
  window: '30d' | '7d' | '1d';
  consumed: number;
  remaining: number;
  status: 'healthy' | 'warning' | 'critical';
}

export class ErrorBudgetTracker {
  private slo: number;
  private window: number;

  constructor(slo: number = 99.9, windowDays: number = 30) {
    this.slo = slo;
    this.window = windowDays * 24 * 60 * 60 * 1000;
  }

  calculateBudget(errors: number, total: number): ErrorBudget {
    const errorRate = (errors / total) * 100;
    const allowedErrorRate = 100 - this.slo;
    const consumed = (errorRate / allowedErrorRate) * 100;
    const remaining = Math.max(0, 100 - consumed);

    let status: 'healthy' | 'warning' | 'critical';
    if (remaining > 50) status = 'healthy';
    else if (remaining > 20) status = 'warning';
    else status = 'critical';

    return {
      slo: this.slo,
      window: '30d',
      consumed,
      remaining,
      status,
    };
  }

  async getMetrics(): Promise<ErrorBudget> {
    const metrics = await this.fetchMetrics();
    return this.calculateBudget(metrics.errors, metrics.total);
  }

  private async fetchMetrics() {
    return { errors: 10, total: 100000 };
  }
}
