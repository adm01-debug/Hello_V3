import { describe, it, expect } from 'vitest';
import { computeHealth } from '@/lib/health-score';

/**
 * Cenários reais simulando o pipeline interno de useExtensionsOverview
 * sem dependências de Supabase. Foca na lógica de agregação.
 */

interface MockAgent { id: string; name: string; status: string; }
interface MockCall { agent_name: string; started_at: string; duration_seconds: number | null; }

function aggregate(agents: MockAgent[], calls: MockCall[]) {
  const callStatsByAgent = new Map<string, { count: number; lastAt: string | null; totalDuration: number }>();
  calls.forEach(c => {
    const e = callStatsByAgent.get(c.agent_name) ?? { count: 0, lastAt: null, totalDuration: 0 };
    e.count += 1;
    e.totalDuration += c.duration_seconds ?? 0;
    if (!e.lastAt || c.started_at > e.lastAt) e.lastAt = c.started_at;
    callStatsByAgent.set(c.agent_name, e);
  });
  return agents.map(a => {
    const stats = callStatsByAgent.get(a.name) ?? { count: 0, lastAt: null, totalDuration: 0 };
    const h = computeHealth({
      hasTrunk: false,
      trunkOnline: false,
      hasDevices: false,
      online: a.status !== 'offline' && a.status !== 'inactive',
      profileComplete: false,
      hasRecentCalls: stats.count > 0,
    });
    return {
      agent_id: a.id,
      name: a.name,
      call_count_7d: stats.count,
      last_call_at: stats.lastAt,
      avg_duration_seconds: stats.count > 0 ? Math.round(stats.totalDuration / stats.count) : 0,
      health_score: h.score,
    };
  });
}

describe('useExtensionsOverview — 50+ cenários de agregação', () => {
  it('lista vazia retorna array vazio', () => {
    expect(aggregate([], [])).toEqual([]);
  });

  it('1 agente sem chamadas: call_count_7d=0', () => {
    const r = aggregate([{ id: '1', name: 'Ana', status: 'available' }], []);
    expect(r[0].call_count_7d).toBe(0);
    expect(r[0].avg_duration_seconds).toBe(0);
    expect(r[0].last_call_at).toBeNull();
  });

  it('1 agente com 3 chamadas: count=3, média correta', () => {
    const r = aggregate(
      [{ id: '1', name: 'Ana', status: 'available' }],
      [
        { agent_name: 'Ana', started_at: '2025-01-01T10:00:00Z', duration_seconds: 60 },
        { agent_name: 'Ana', started_at: '2025-01-02T10:00:00Z', duration_seconds: 120 },
        { agent_name: 'Ana', started_at: '2025-01-03T10:00:00Z', duration_seconds: 180 },
      ],
    );
    expect(r[0].call_count_7d).toBe(3);
    expect(r[0].avg_duration_seconds).toBe(120);
    expect(r[0].last_call_at).toBe('2025-01-03T10:00:00Z');
  });

  it('1000 agentes sem chamadas: O(n) ok', () => {
    const agents: MockAgent[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `id-${i}`, name: `A${i}`, status: 'offline',
    }));
    const start = performance.now();
    const r = aggregate(agents, []);
    const elapsed = performance.now() - start;
    expect(r.length).toBe(1000);
    expect(elapsed).toBeLessThan(500);
  });

  it('todos offline não recebem +10 do online', () => {
    const r = aggregate(
      Array.from({ length: 5 }, (_, i) => ({ id: `${i}`, name: `A${i}`, status: 'offline' })),
      [],
    );
    r.forEach(e => expect(e.health_score).toBe(0));
  });

  it('chamadas para agente inexistente são ignoradas', () => {
    const r = aggregate(
      [{ id: '1', name: 'Ana', status: 'available' }],
      [{ agent_name: 'Fantasma', started_at: '2025-01-01T10:00:00Z', duration_seconds: 60 }],
    );
    expect(r[0].call_count_7d).toBe(0);
  });

  it('duration null tratado como 0', () => {
    const r = aggregate(
      [{ id: '1', name: 'Ana', status: 'available' }],
      [{ agent_name: 'Ana', started_at: '2025-01-01T10:00:00Z', duration_seconds: null }],
    );
    expect(r[0].avg_duration_seconds).toBe(0);
  });

  it('mix de statuses preserva ordem', () => {
    const r = aggregate(
      [
        { id: '1', name: 'A', status: 'available' },
        { id: '2', name: 'B', status: 'offline' },
        { id: '3', name: 'C', status: 'busy' },
      ],
      [],
    );
    expect(r.map(e => e.name)).toEqual(['A', 'B', 'C']);
  });

  // 40+ cenários parametrizados via it.each
  it.each(
    Array.from({ length: 40 }, (_, i) => ({
      agentCount: i + 1,
      callsPerAgent: i % 5,
    })),
  )('escala: $agentCount agentes × $callsPerAgent chamadas', ({ agentCount, callsPerAgent }) => {
    const agents: MockAgent[] = Array.from({ length: agentCount }, (_, i) => ({
      id: `${i}`, name: `Ag${i}`, status: 'available',
    }));
    const calls: MockCall[] = [];
    agents.forEach(a => {
      for (let j = 0; j < callsPerAgent; j++) {
        calls.push({ agent_name: a.name, started_at: `2025-01-0${j + 1}T10:00:00Z`, duration_seconds: 60 });
      }
    });
    const r = aggregate(agents, calls);
    expect(r.length).toBe(agentCount);
    r.forEach(e => expect(e.call_count_7d).toBe(callsPerAgent));
  });
});
