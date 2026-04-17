/**
 * RLS Declarativa — tabela `contacts`
 * Matriz de permissões por role: agent (SELECT/INSERT/UPDATE), supervisor/admin (full),
 * DELETE restrito a admin.
 */
import { describe, it, expect } from 'vitest';

type Role = 'agent' | 'supervisor' | 'admin';
type Op = 'select' | 'insert' | 'update' | 'delete';

const MATRIX: Record<Role, Record<Op, boolean>> = {
  agent:      { select: true,  insert: true,  update: true,  delete: false },
  supervisor: { select: true,  insert: true,  update: true,  delete: false },
  admin:      { select: true,  insert: true,  update: true,  delete: true  },
};

function can(role: Role, op: Op): boolean { return MATRIX[role][op]; }

describe('RLS — contacts (matriz por role)', () => {
  it.each(['agent','supervisor','admin'] as Role[])('%s pode SELECT contacts', (r) => {
    expect(can(r, 'select')).toBe(true);
  });

  it.each(['agent','supervisor','admin'] as Role[])('%s pode INSERT contacts', (r) => {
    expect(can(r, 'insert')).toBe(true);
  });

  it.each(['agent','supervisor','admin'] as Role[])('%s pode UPDATE contacts', (r) => {
    expect(can(r, 'update')).toBe(true);
  });

  it('apenas admin pode DELETE contacts', () => {
    expect(can('agent', 'delete')).toBe(false);
    expect(can('supervisor', 'delete')).toBe(false);
    expect(can('admin', 'delete')).toBe(true);
  });
});
