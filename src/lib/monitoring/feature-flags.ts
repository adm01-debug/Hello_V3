export class FeatureFlagMonitor {
  private flags: Map<string, FlagMetrics> = new Map();

  trackFlag(name: string, enabled: boolean, userId?: string) {
    const metrics = this.flags.get(name) || {
      name,
      enabledCount: 0,
      disabledCount: 0,
      users: new Set(),
    };

    if (enabled) metrics.enabledCount++;
    else metrics.disabledCount++;
    
    if (userId) metrics.users.add(userId);
    
    this.flags.set(name, metrics);
  }

  getMetrics(name: string): FlagMetrics | undefined {
    return this.flags.get(name);
  }

  getAllMetrics(): FlagMetrics[] {
    return Array.from(this.flags.values());
  }
}

interface FlagMetrics {
  name: string;
  enabledCount: number;
  disabledCount: number;
  users: Set<string>;
}
