import { describe, it, expect } from 'vitest';
import { computeTalkRatio } from '@/lib/talkRatio';

describe('computeTalkRatio', () => {
  it('returns zeros for empty input', () => {
    const r = computeTalkRatio([]);
    expect(r.totalDuration).toBe(0);
    expect(r.agentTalkSeconds).toBe(0);
    expect(r.customerTalkSeconds).toBe(0);
    expect(r.benchmark.status).toBe('agent_low');
  });

  it('maps first speaker to agent and second to customer', () => {
    const r = computeTalkRatio([
      { speaker: 'spk_0', start: 0, end: 10 },
      { speaker: 'spk_1', start: 10, end: 20 },
    ], 20);
    expect(r.agentTalkSeconds).toBe(10);
    expect(r.customerTalkSeconds).toBe(10);
    expect(r.agentTalkRatio).toBe(0.5);
    expect(r.benchmark.status).toBe('optimal');
  });

  it('detects interruptions when overlap > 0.3s', () => {
    const r = computeTalkRatio([
      { speaker: 'a', start: 0, end: 5 },
      { speaker: 'b', start: 4, end: 8 },
    ], 8);
    expect(r.interruptions).toBe(1);
  });

  it('flags agent_high when agent dominates', () => {
    const r = computeTalkRatio([
      { speaker: 'a', start: 0, end: 80 },
      { speaker: 'b', start: 80, end: 100 },
    ], 100);
    expect(r.benchmark.status).toBe('agent_high');
  });

  it('computes silence as remainder of total duration', () => {
    const r = computeTalkRatio([
      { speaker: 'a', start: 0, end: 10 },
      { speaker: 'b', start: 10, end: 20 },
    ], 50);
    expect(r.silenceSeconds).toBe(30);
    expect(r.silenceRatio).toBe(0.6);
  });

  it('tracks longest monologues per role', () => {
    const r = computeTalkRatio([
      { speaker: 'a', start: 0, end: 15 },
      { speaker: 'a', start: 15, end: 25 },
      { speaker: 'b', start: 25, end: 30 },
    ], 30);
    expect(r.longestAgentMonologueSeconds).toBe(25);
    expect(r.longestCustomerMonologueSeconds).toBe(5);
  });
});
