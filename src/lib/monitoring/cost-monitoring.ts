import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_KEY!
);

export interface CostMetrics {
  service: string;
  cost: number;
  currency: string;
  period: string;
  trend: 'up' | 'down' | 'stable';
  changePercent?: number;
}

export interface CostForecast {
  month: number;
  predicted: number;
  confidence: {
    lower: number;
    upper: number;
  };
}

export class CostMonitoring {
  // Get costs for all services
  async getInfrastructureCosts(): Promise<CostMetrics[]> {
    try {
      const [aws, vercel, supabase, other] = await Promise.all([
        this.getAWSCost(),
        this.getVercelCost(),
        this.getSupabaseCost(),
        this.getOtherCosts(),
      ]);

      return [
        { service: 'AWS', cost: aws.cost, currency: 'USD', period: 'monthly', trend: aws.trend, changePercent: aws.change },
        { service: 'Vercel', cost: vercel.cost, currency: 'USD', period: 'monthly', trend: vercel.trend, changePercent: vercel.change },
        { service: 'Supabase', cost: supabase.cost, currency: 'USD', period: 'monthly', trend: supabase.trend, changePercent: supabase.change },
        { service: 'Other', cost: other.cost, currency: 'USD', period: 'monthly', trend: other.trend, changePercent: other.change },
      ];
    } catch (error) {
      console.error('Failed to get infrastructure costs:', error);
      return [];
    }
  }

  // Calculate cost per user
  async getCostPerUser(): Promise<number> {
    try {
      const costs = await this.getInfrastructureCosts();
      const totalCost = costs.reduce((sum, m) => sum + m.cost, 0);
      
      const activeUsers = await this.getActiveUsers();
      if (activeUsers === 0) return 0;
      
      return Math.round((totalCost / activeUsers) * 100) / 100;
    } catch (error) {
      console.error('Failed to calculate cost per user:', error);
      return 0;
    }
  }

  // Forecast costs using linear regression
  async forecastCost(months: number): Promise<CostForecast[]> {
    try {
      if (months <= 0 || months > 24) {
        throw new Error('Forecast period must be between 1 and 24 months');
      }

      const historical = await this.getHistoricalCosts(12);
      if (historical.length < 3) {
        throw new Error('Insufficient historical data for forecasting');
      }

      const trend = this.calculateTrend(historical);
      const volatility = this.calculateVolatility(historical);
      
      const forecast: CostForecast[] = [];
      let lastValue = historical[historical.length - 1];
      
      for (let i = 1; i <= months; i++) {
        const predicted = lastValue * (1 + trend);
        const margin = predicted * volatility * 1.96; // 95% confidence interval
        
        forecast.push({
          month: i,
          predicted: Math.round(predicted * 100) / 100,
          confidence: {
            lower: Math.max(0, Math.round((predicted - margin) * 100) / 100),
            upper: Math.round((predicted + margin) * 100) / 100,
          },
        });
        
        lastValue = predicted;
      }
      
      return forecast;
    } catch (error) {
      console.error('Failed to forecast costs:', error);
      return [];
    }
  }

  // Calculate cost optimization opportunities
  async getOptimizationOpportunities(): Promise<Array<{
    service: string;
    opportunity: string;
    potentialSavings: number;
    effort: 'low' | 'medium' | 'high';
  }>> {
    const opportunities: Array<{
      service: string;
      opportunity: string;
      potentialSavings: number;
      effort: 'low' | 'medium' | 'high';
    }> = [];

    try {
      // Check for unused resources
      const unusedResources = await this.findUnusedResources();
      if (unusedResources.length > 0) {
        opportunities.push({
          service: 'AWS',
          opportunity: `${unusedResources.length} unused resources detected`,
          potentialSavings: unusedResources.reduce((sum, r) => sum + r.cost, 0),
          effort: 'low',
        });
      }

      // Check for reserved instance opportunities
      const riSavings = await this.calculateRISavings();
      if (riSavings > 0) {
        opportunities.push({
          service: 'AWS',
          opportunity: 'Switch to reserved instances',
          potentialSavings: riSavings,
          effort: 'medium',
        });
      }

      // Check for autoscaling configuration
      const autoscalingSavings = await this.calculateAutoscalingSavings();
      if (autoscalingSavings > 0) {
        opportunities.push({
          service: 'AWS',
          opportunity: 'Optimize autoscaling configuration',
          potentialSavings: autoscalingSavings,
          effort: 'medium',
        });
      }

      return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
    } catch (error) {
      console.error('Failed to get optimization opportunities:', error);
      return [];
    }
  }

  // Alert on budget threshold
  async checkBudgetThreshold(threshold: number): Promise<{
    exceeded: boolean;
    currentSpend: number;
    threshold: number;
    percentUsed: number;
  }> {
    try {
      const costs = await this.getInfrastructureCosts();
      const currentSpend = costs.reduce((sum, m) => sum + m.cost, 0);
      const percentUsed = (currentSpend / threshold) * 100;

      return {
        exceeded: currentSpend > threshold,
        currentSpend,
        threshold,
        percentUsed: Math.round(percentUsed * 100) / 100,
      };
    } catch (error) {
      console.error('Failed to check budget threshold:', error);
      return { exceeded: false, currentSpend: 0, threshold, percentUsed: 0 };
    }
  }

  // Private helper methods
  private async getAWSCost(): Promise<{ cost: number; trend: 'up' | 'down' | 'stable'; change: number }> {
    // In production, use AWS Cost Explorer API
    const current = 1500;
    const previous = 1450;
    const change = ((current - previous) / previous) * 100;
    return {
      cost: current,
      trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      change: Math.round(change * 10) / 10,
    };
  }

  private async getVercelCost(): Promise<{ cost: number; trend: 'up' | 'down' | 'stable'; change: number }> {
    const current = 200;
    const previous = 180;
    const change = ((current - previous) / previous) * 100;
    return {
      cost: current,
      trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      change: Math.round(change * 10) / 10,
    };
  }

  private async getSupabaseCost(): Promise<{ cost: number; trend: 'up' | 'down' | 'stable'; change: number }> {
    const current = 300;
    const previous = 320;
    const change = ((current - previous) / previous) * 100;
    return {
      cost: current,
      trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      change: Math.round(change * 10) / 10,
    };
  }

  private async getOtherCosts(): Promise<{ cost: number; trend: 'up' | 'down' | 'stable'; change: number }> {
    return { cost: 100, trend: 'stable', change: 0 };
  }

  private async getActiveUsers(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      return count || 0;
    } catch (error) {
      console.error('Failed to get active users:', error);
      return 0;
    }
  }

  private async getHistoricalCosts(months: number): Promise<number[]> {
    // In production, fetch from cost tracking database
    const baseCost = 2000;
    return Array.from({ length: months }, (_, i) => 
      baseCost + i * 50 + (Math.random() - 0.5) * 100
    );
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const recent = values.slice(-Math.min(3, n));
    const older = values.slice(-Math.min(6, n), -Math.min(3, n));
    
    if (older.length === 0) return 0;
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    return (recentAvg - olderAvg) / olderAvg;
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0.1;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev / mean; // Coefficient of variation
  }

  private async findUnusedResources(): Promise<Array<{ name: string; cost: number }>> {
    // Mock implementation - in production, use AWS Resource Groups Tagging API
    return [];
  }

  private async calculateRISavings(): Promise<number> {
    // Mock implementation - in production, use AWS Cost Explorer
    return 0;
  }

  private async calculateAutoscalingSavings(): Promise<number> {
    // Mock implementation
    return 0;
  }
}

export const costMonitoring = new CostMonitoring();
export default costMonitoring;
