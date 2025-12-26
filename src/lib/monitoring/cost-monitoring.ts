export interface CostMetrics {
  service: string;
  cost: number;
  currency: string;
  period: string;
  trend: 'up' | 'down' | 'stable';
}

export class CostMonitoring {
  async getInfrastructureCosts(): Promise<CostMetrics[]> {
    return [
      {
        service: 'AWS',
        cost: await this.getAWSCost(),
        currency: 'USD',
        period: 'monthly',
        trend: 'stable',
      },
      {
        service: 'Vercel',
        cost: await this.getVercelCost(),
        currency: 'USD',
        period: 'monthly',
        trend: 'up',
      },
      {
        service: 'Supabase',
        cost: await this.getSupabaseCost(),
        currency: 'USD',
        period: 'monthly',
        trend: 'down',
      },
    ];
  }

  async getCostPerUser(): Promise<number> {
    const totalCost = (await this.getInfrastructureCosts()).reduce(
      (sum, m) => sum + m.cost,
      0
    );
    const activeUsers = await this.getActiveUsers();
    return totalCost / activeUsers;
  }

  async forecastCost(months: number): Promise<number[]> {
    const historical = await this.getHistoricalCosts(12);
    const trend = this.calculateTrend(historical);
    
    const forecast: number[] = [];
    let lastValue = historical[historical.length - 1];
    
    for (let i = 0; i < months; i++) {
      lastValue = lastValue * (1 + trend);
      forecast.push(lastValue);
    }
    
    return forecast;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const recent = values.slice(-3).reduce((a, b) => a + b) / 3;
    const older = values.slice(-6, -3).reduce((a, b) => a + b) / 3;
    return (recent - older) / older;
  }

  private async getAWSCost(): Promise<number> {
    return 1500;
  }

  private async getVercelCost(): Promise<number> {
    return 200;
  }

  private async getSupabaseCost(): Promise<number> {
    return 300;
  }

  private async getActiveUsers(): Promise<number> {
    return 5000;
  }

  private async getHistoricalCosts(months: number): Promise<number[]> {
    return Array(months).fill(0).map((_, i) => 2000 + i * 50);
  }
}
