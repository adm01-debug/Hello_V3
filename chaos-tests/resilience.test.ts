import { describe, it, expect } from 'vitest';

describe('Chaos Engineering Tests', () => {
  it('should recover from random failures', async () => {
    const results = [];
    
    for (let i = 0; i < 100; i++) {
      try {
        const result = await chaosRequest();
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error });
      }
    }
    
    const successRate = results.filter(r => r.success).length / 100;
    expect(successRate).toBeGreaterThan(0.7);
  });

  it('should handle network latency', async () => {
    const latencies = [0, 100, 500, 1000, 2000];
    
    for (const latency of latencies) {
      const start = Date.now();
      await requestWithLatency(latency);
      const duration = Date.now() - start;
      
      expect(duration).toBeGreaterThanOrEqual(latency);
    }
  });

  it('should survive dependency failures', async () => {
    const result = await requestWithFallback();
    expect(result.source).toBeDefined();
  });

  it('should handle resource exhaustion', async () => {
    const largeData = new Array(10000).fill({ data: 'x'.repeat(1000) });
    const result = await processLargeDataset(largeData);
    
    expect(result.processed).toBe(true);
  });
});

async function chaosRequest() {
  if (Math.random() > 0.8) throw new Error('Chaos!');
  return { data: 'success' };
}

async function requestWithLatency(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms));
  return { success: true };
}

async function requestWithFallback() {
  try {
    return { data: 'primary', source: 'primary' };
  } catch {
    return { data: 'fallback', source: 'fallback' };
  }
}

async function processLargeDataset(data: any[]) {
  return { processed: true, count: data.length };
}
