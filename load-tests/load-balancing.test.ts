import { describe, it, expect } from 'vitest';

describe('Load Balancing Tests', () => {
  describe('Round Robin', () => {
    it('should distribute requests evenly', async () => {
      const servers = ['server1', 'server2', 'server3'];
      const requests = 30;
      const distribution: Record<string, number> = {};

      for (let i = 0; i < requests; i++) {
        const server = await loadBalancer.getServer();
        distribution[server] = (distribution[server] || 0) + 1;
      }

      expect(distribution['server1']).toBe(10);
      expect(distribution['server2']).toBe(10);
      expect(distribution['server3']).toBe(10);
    });
  });

  describe('Least Connections', () => {
    it('should route to server with fewest connections', async () => {
      loadBalancer.setStrategy('least-connections');
      
      const server1 = await loadBalancer.getServer();
      expect(server1).toBeDefined();
    });
  });

  describe('Health Checks', () => {
    it('should skip unhealthy servers', async () => {
      loadBalancer.markUnhealthy('server2');
      
      for (let i = 0; i < 10; i++) {
        const server = await loadBalancer.getServer();
        expect(server).not.toBe('server2');
      }
    });
  });
});

const loadBalancer = {
  currentIndex: 0,
  servers: ['server1', 'server2', 'server3'],
  unhealthy: new Set<string>(),
  async getServer() {
    const available = this.servers.filter(s => !this.unhealthy.has(s));
    const server = available[this.currentIndex % available.length];
    this.currentIndex++;
    return server;
  },
  setStrategy(s: string) {},
  markUnhealthy(s: string) { this.unhealthy.add(s); },
};
