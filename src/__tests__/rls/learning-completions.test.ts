/**
 * RLS Declarativa — `learning_completions`
 * Agente registra apenas próprias conclusões (agent_name = get_user_agent_name()).
 * Supervisor/admin podem visualizar todas para coaching.
 */
import { describe, it, expect } from 'vitest';

type Role = 'agent' | 'supervisor' | 'admin';

interface Completion { id: string; agent_name: string; module_id: string }

const ROWS: Completion[] = [
  { id: 'c1', agent_name: 'Alice', module_id: 'objection-handling' },
  { id: 'c2', agent_name: 'Bob',   module_id: 'discovery' },
];

function canInsert(role: Role, payloadAgent: string, sessionAgent: string) {
  if (role === 'agent') return payloadAgent === sessionAgent;
  return true;
}

function visibleRows(role: Role, sessionAgent: string) {
  if (role === 'agent') return ROWS.filter((r) => r.agent_name === sessionAgent);
  return ROWS;
}

describe('RLS — learning_completions', () => {
  it('agente só vê próprias conclusões', () => {
    expect(visibleRows('agent', 'Alice').map((r) => r.id)).toEqual(['c1']);
  });

  it('supervisor vê todas', () => {
    expect(visibleRows('supervisor', 'Alice')).toHaveLength(2);
  });

  it('agente NÃO pode inserir conclusão de outro agente', () => {
    expect(canInsert('agent', 'Bob', 'Alice')).toBe(false);
  });

  it('agente pode inserir própria conclusão', () => {
    expect(canInsert('agent', 'Alice', 'Alice')).toBe(true);
  });

  it('admin pode inserir em nome de qualquer agente (correção manual)', () => {
    expect(canInsert('admin', 'Bob', 'Admin')).toBe(true);
  });
});
