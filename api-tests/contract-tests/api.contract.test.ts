import { describe, it, expect } from 'vitest';

describe('API Contract Tests', () => {
  it('GET /api/calls should return array', async () => {
    const response = await fetch('/api/calls');
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('phoneNumber');
  });
  
  it('POST /api/calls should create call', async () => {
    const response = await fetch('/api/calls', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber: '+5511999999999' })
    });
    expect(response.status).toBe(201);
  });
});
