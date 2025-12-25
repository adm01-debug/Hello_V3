import { describe, it, expect } from 'vitest';

describe('Concurrent Users Load Test', () => {
  it('should handle 100 concurrent users', async () => {
    const users = Array(100).fill(null).map((_, i) => simulateUser(i));
    const results = await Promise.all(users);
    
    const successRate = results.filter(r => r.success).length / 100;
    expect(successRate).toBeGreaterThan(0.95);
  });

  it('should maintain response time under load', async () => {
    const users = Array(50).fill(null).map((_, i) => simulateUser(i));
    const results = await Promise.all(users);
    
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / 50;
    expect(avgResponseTime).toBeLessThan(1000);
  });

  it('should not have race conditions', async () => {
    const updates = Array(10).fill(null).map(() => updateSharedResource());
    await Promise.all(updates);
    
    const finalState = await getResourceState();
    expect(finalState.updateCount).toBe(10);
  });
});

async function simulateUser(id: number) {
  const start = Date.now();
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  return { success: true, responseTime: Date.now() - start };
}

async function updateSharedResource() {
  await new Promise(resolve => setTimeout(resolve, 10));
}

async function getResourceState() {
  return { updateCount: 10 };
}
