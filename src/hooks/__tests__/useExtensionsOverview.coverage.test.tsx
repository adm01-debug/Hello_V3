import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Per-table result registry; supabase.from(table) returns a chain that resolves
// to results[table] when awaited (terminal methods order/eq/gte all resolve).
const results: Record<string, { data: unknown[] | null; error: unknown }> = {};
const removeChannelMock = vi.fn();
const subscribeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => {
  const makeChain = (table: string) => {
    const resolved = () => Promise.resolve(results[table] ?? { data: [], error: null });
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => chain);
    chain.order = vi.fn(() => resolved());
    chain.eq = vi.fn(() => resolved());
    chain.gte = vi.fn(() => resolved());
    chain.then = (cb: (v: unknown) => unknown) => resolved().then(cb);
    return chain;
  };
  return {
    supabase: {
      from: vi.fn((table: string) => makeChain(table)),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: (...a: unknown[]) => { subscribeMock(...a); return { on: vi.fn() }; },
      })),
      removeChannel: (...a: unknown[]) => removeChannelMock(...a),
    },
  };
});

vi.mock('@/lib/logger', () => ({
  logger: {
    create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  },
}));

import { useExtensionsOverview } from '@/hooks/useExtensionsOverview';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of Object.keys(results)) delete results[k];
});

describe('useExtensionsOverview', () => {
  it('aggregates agents with trunks, devices, profiles and calls', async () => {
    const recent = new Date().toISOString();
    results.agents = {
      data: [
        { id: 'a1', name: 'Alice', extension: '100', status: 'available', department: 'sales', email: 'a@x.com', avatar_url: null },
        { id: 'a2', name: 'Bob', extension: '101', status: 'offline', department: null, email: null, avatar_url: null },
      ],
      error: null,
    };
    results.user_profiles = {
      data: [{ id: 'p1', agent_id: 'a1', full_name: 'Alice Full', role: 'agent' }],
      error: null,
    };
    results.agent_trunk_assignments = {
      data: [
        { agent_id: 'a1', is_primary: false, trunk_id: 't0', voip_trunks: { id: 't0', name: 'T0', provider: 'p', last_health_status: 'degraded' } },
        { agent_id: 'a1', is_primary: true, trunk_id: 't1', voip_trunks: { id: 't1', name: 'T1', provider: 'twilio', last_health_status: 'healthy' } },
      ],
      error: null,
    };
    results.agent_devices = {
      data: [{ agent_name: 'Alice' }, { agent_name: 'Alice' }],
      error: null,
    };
    results.call_sessions = {
      data: [
        { agent_name: 'Alice', started_at: recent, duration_seconds: 120 },
        { agent_name: 'Alice', started_at: recent, duration_seconds: 60 },
        { agent_name: null, started_at: recent, duration_seconds: 10 },
      ],
      error: null,
    };

    const { result } = renderHook(() => useExtensionsOverview(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data!;
    expect(data.length).toBe(2);
    const alice = data.find(d => d.agent_id === 'a1')!;
    expect(alice.primary_trunk_id).toBe('t1');
    expect(alice.primary_trunk_health).toBe('healthy');
    expect(alice.device_count).toBe(2);
    expect(alice.call_count_7d).toBe(2);
    expect(alice.avg_duration_seconds).toBe(90);
    expect(alice.user_full_name).toBe('Alice Full');
    expect(alice.health_score).toBeGreaterThan(0);

    const bob = data.find(d => d.agent_id === 'a2')!;
    expect(bob.primary_trunk_id).toBeNull();
    expect(bob.device_count).toBe(0);
    expect(bob.health_issues.length).toBeGreaterThan(0);

    expect(subscribeMock).toHaveBeenCalled();
  });

  it('handles empty datasets', async () => {
    results.agents = { data: [], error: null };
    const { result } = renderHook(() => useExtensionsOverview(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('throws when agents query errors', async () => {
    results.agents = { data: null, error: { message: 'agents fail' } };
    const { result } = renderHook(() => useExtensionsOverview(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('unsubscribes channel on unmount', async () => {
    results.agents = { data: [], error: null };
    const { result, unmount } = renderHook(() => useExtensionsOverview(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    unmount();
    expect(removeChannelMock).toHaveBeenCalled();
  });
});
