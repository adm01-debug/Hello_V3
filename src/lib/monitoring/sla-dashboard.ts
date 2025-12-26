import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_KEY!
);

export interface SLAMetrics {
  uptime: number;
  availability: number;
  responseTime: number;
  errorRate: number;
  period: string;
}

export class SLADashboard {
  async getCurrentMetrics(): Promise<SLAMetrics> {
    const [uptime, responseTime, errorRate] = await Promise.all([
      this.calculateUptime(),
      this.calculateResponseTime(),
      this.calculateErrorRate(),
    ]);

    return {
      uptime,
      availability: uptime,
      responseTime,
      errorRate,
      period: '30d',
    };
  }

  private async calculateUptime(): Promise<number> {
    const { data } = await supabase
      .from('health_checks')
      .select('status')
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!data || data.length === 0) return 100;

    const upCount = data.filter(h => h.status === 'up').length;
    return (upCount / data.length) * 100;
  }

  private async calculateResponseTime(): Promise<number> {
    const { data } = await supabase
      .from('api_metrics')
      .select('response_time')
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!data || data.length === 0) return 0;

    const avg = data.reduce((sum, m) => sum + m.response_time, 0) / data.length;
    return Math.round(avg);
  }

  private async calculateErrorRate(): Promise<number> {
    const { data } = await supabase
      .from('api_metrics')
      .select('status')
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!data || data.length === 0) return 0;

    const errorCount = data.filter(m => m.status >= 400).length;
    return (errorCount / data.length) * 100;
  }
}
