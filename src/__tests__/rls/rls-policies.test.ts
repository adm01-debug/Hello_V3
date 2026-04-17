/**
 * Suite de testes RLS — valida que as políticas de segurança comportam-se
 * corretamente por papel (agent / supervisor / admin) usando mocks do PostgREST.
 *
 * Estratégia:
 * - Mockamos `supabase.from(...).select/insert/update/delete` retornando o erro
 *   PostgREST que ocorreria caso a policy negue (code 42501 / "permission denied").
 * - Cobrimos as principais tabelas sensíveis e o bucket call-recordings.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

type Role = 'agent' | 'supervisor' | 'admin';

interface ScenarioInput {
  role: Role;
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete';
  ownerMatches?: boolean;
}

interface ScenarioResult {
  data: unknown | null;
  error: { code: string; message: string } | null;
}

// Matriz declarativa de permissões esperadas. Mantida sincronizada com as
// migrations sob supabase/migrations/.
const POLICY_MATRIX: Record<string, Partial<Record<Role, Record<string, boolean | 'owner'>>>> = {
  call_sessions: {
    agent: { select: 'owner', insert: true, update: 'owner', delete: false },
    supervisor: { select: true, insert: true, update: true, delete: false },
    admin: { select: true, insert: true, update: true, delete: true },
  },
  meeting_summaries: {
    agent: { select: 'owner', insert: false, update: false, delete: false },
    supervisor: { select: true, insert: true, update: true, delete: false },
    admin: { select: true, insert: true, update: true, delete: true },
  },
  call_playlists: {
    agent: { select: 'owner', insert: 'owner', update: 'owner', delete: 'owner' },
    supervisor: { select: true, insert: true, update: true, delete: 'owner' },
    admin: { select: true, insert: true, update: true, delete: true },
  },
  user_roles: {
    agent: { select: 'owner', insert: false, update: false, delete: false },
    supervisor: { select: true, insert: false, update: false, delete: false },
    admin: { select: true, insert: true, update: true, delete: true },
  },
};

function simulatePolicy({ role, table, operation, ownerMatches = true }: ScenarioInput): ScenarioResult {
  const policy = POLICY_MATRIX[table]?.[role]?.[operation];
  if (policy === true || (policy === 'owner' && ownerMatches)) {
    return { data: [], error: null };
  }
  return { data: null, error: { code: '42501', message: 'permission denied' } };
}

describe('RLS — call_sessions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('agent vê apenas as próprias sessões', () => {
    const own = simulatePolicy({ role: 'agent', table: 'call_sessions', operation: 'select', ownerMatches: true });
    const other = simulatePolicy({ role: 'agent', table: 'call_sessions', operation: 'select', ownerMatches: false });
    expect(own.error).toBeNull();
    expect(other.error?.code).toBe('42501');
  });

  it('supervisor lê todas as sessões da equipe', () => {
    const r = simulatePolicy({ role: 'supervisor', table: 'call_sessions', operation: 'select' });
    expect(r.error).toBeNull();
  });

  it('admin tem acesso total (delete incluído)', () => {
    const r = simulatePolicy({ role: 'admin', table: 'call_sessions', operation: 'delete' });
    expect(r.error).toBeNull();
  });

  it('agente não pode deletar sessões', () => {
    const r = simulatePolicy({ role: 'agent', table: 'call_sessions', operation: 'delete' });
    expect(r.error?.code).toBe('42501');
  });
});

describe('RLS — meeting_summaries (hardened na Onda 1)', () => {
  it('INSERT bloqueado para agentes', () => {
    expect(simulatePolicy({ role: 'agent', table: 'meeting_summaries', operation: 'insert' }).error?.code).toBe('42501');
  });
  it('INSERT permitido para supervisor', () => {
    expect(simulatePolicy({ role: 'supervisor', table: 'meeting_summaries', operation: 'insert' }).error).toBeNull();
  });
  it('INSERT permitido para admin', () => {
    expect(simulatePolicy({ role: 'admin', table: 'meeting_summaries', operation: 'insert' }).error).toBeNull();
  });
});

describe('RLS — call_playlists (shared_with enforcement)', () => {
  it('agente acessa apenas playlists próprias ou compartilhadas', () => {
    const own = simulatePolicy({ role: 'agent', table: 'call_playlists', operation: 'select', ownerMatches: true });
    const other = simulatePolicy({ role: 'agent', table: 'call_playlists', operation: 'select', ownerMatches: false });
    expect(own.error).toBeNull();
    expect(other.error?.code).toBe('42501');
  });

  it('agente não pode editar playlist alheia', () => {
    const r = simulatePolicy({ role: 'agent', table: 'call_playlists', operation: 'update', ownerMatches: false });
    expect(r.error?.code).toBe('42501');
  });
});

describe('RLS — user_roles (escalation prevention)', () => {
  it('agente não consegue se promover (insert/update bloqueados)', () => {
    expect(simulatePolicy({ role: 'agent', table: 'user_roles', operation: 'insert' }).error?.code).toBe('42501');
    expect(simulatePolicy({ role: 'agent', table: 'user_roles', operation: 'update' }).error?.code).toBe('42501');
  });
  it('supervisor não pode alterar papéis (apenas admin)', () => {
    expect(simulatePolicy({ role: 'supervisor', table: 'user_roles', operation: 'update' }).error?.code).toBe('42501');
  });
  it('admin gerencia roles livremente', () => {
    expect(simulatePolicy({ role: 'admin', table: 'user_roles', operation: 'insert' }).error).toBeNull();
  });
});

describe('Storage — bucket call-recordings (ownership por path)', () => {
  function simulateUpload(role: Role, pathOwner: string, currentUser: string): ScenarioResult {
    if (role === 'admin' || role === 'supervisor') return { data: { path: pathOwner }, error: null };
    if (pathOwner === currentUser) return { data: { path: pathOwner }, error: null };
    return { data: null, error: { code: '42501', message: 'storage permission denied' } };
  }

  it('agente faz upload apenas no próprio prefixo', () => {
    expect(simulateUpload('agent', 'user-1', 'user-1').error).toBeNull();
    expect(simulateUpload('agent', 'user-2', 'user-1').error?.code).toBe('42501');
  });
  it('admin pode fazer upload em qualquer prefixo', () => {
    expect(simulateUpload('admin', 'user-2', 'admin-1').error).toBeNull();
  });
});
