export class FeatureFlags {
  private flags: Map<string, boolean> = new Map();

  async loadFlags(userId: string) {
    const response = await fetch(`/api/feature-flags?userId=${userId}`);
    const data = await response.json();
    
    Object.entries(data).forEach(([key, value]) => {
      this.flags.set(key, value as boolean);
    });
  }

  isEnabled(flag: string): boolean {
    return this.flags.get(flag) || false;
  }

  setFlag(flag: string, enabled: boolean) {
    this.flags.set(flag, enabled);
  }
}

export const featureFlags = new FeatureFlags();
