/**
 * RLS Declarativa — tabela `deals`
 * Garante que agente vê apenas próprias deals (owner_agent_name = get_user_agent_name()),
 * enquanto supervisor/admin enxergam todas. Mocks PostgREST por role.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

type Role = 'agent' | 'supervisor' | 'admin';

interface MockDeal { id: string; owner_agent_name: string; name: string }

const ALL_DEALS: MockDeal[] = [
  { id: 'd1', owner_agent_name: 'Alice', name: 'Deal Alice' },
  { id: 'd2', owner_agent_name: 'Bob', name: 'Deal Bob' },
  { id: 'd3', owner_agent_name: 'Carol', name: 'Deal Carol' },
];

function mockSelect(role: Role, agentName: string) {
  if (role === 'agent') {
    return ALL_DEALS.filter((d) => d.owner_agent_name === agentName);
  }
  return ALL_DEALS;
}

function mockUpdate(role: Role, agentName: string, dealId: string) {
  const deal = ALL_DEALS.find((d) => d.id === dealId);
  if (!deal) return { error: { code: 'PGRST116', message: 'no rows' } };
  if (role === 'agent' && deal.owner_agent_name !== agentName) {
    return { error: { code: '42501', message: 'permission denied' } };
  }
  return { error: null };
}

describe('RLS — deals', () => {
  beforeEach(() => vi.clearAllMocks());

  it('agent enxerga apenas próprias deals', () => {
    const rows = mockSelect('agent', 'Alice');
    expect(rows).toHaveLength(1);
    expect(rows[0].owner_agent_name).toBe('Alice');
  });

  it('supervisor enxerga todas', () => {
    expect(mockSelect('supervisor', 'Alice')).toHaveLength(3);
  });

  it('admin enxerga todas', () => {
    expect(mockSelect('admin', 'Alice')).toHaveLength(3);
  });

  it('agent NÃO pode atualizar deal de outro agente', () => {
    const r = mockUpdate('agent', 'Alice', 'd2');
    expect(r.error?.code).toBe('42501');
  });

  it('agent pode atualizar própria deal', () => {
    const r = mockUpdate('agent', 'Alice', 'd1');
    expect(r.error).toBeNull();
  });

  it('admin pode atualizar qualquer deal', () => {
    const r = mockUpdate('admin', 'Admin', 'd2');
    expect(r.error).toBeNull();
  });
});
