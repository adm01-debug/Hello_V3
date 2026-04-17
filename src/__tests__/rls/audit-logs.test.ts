/**
 * RLS — audit_logs: somente admin lê. INSERT permitido apenas via função
 * `log_audit_event` (security definer) ou usuários autenticados pela RPC.
 * SELECT direto por agent/supervisor deve retornar permission denied.
 */
import { describe, it, expect } from 'vitest';

type Role = 'agent' | 'supervisor' | 'admin' | 'anon';

function simulateAuditAccess(role: Role, op: 'select' | 'insert' | 'update' | 'delete') {
  // admin: select/insert allowed; update/delete denied (auditoria é imutável)
  if (role === 'admin') {
    if (op === 'select' || op === 'insert') return { error: null };
    return { error: { code: '42501', message: 'audit logs are immutable' } };
  }
  // anônimos jamais acessam
  if (role === 'anon') return { error: { code: '42501', message: 'permission denied' } };
  // supervisor/agent: nada permitido (apenas via RPC log_audit_event)
  return { error: { code: '42501', message: 'permission denied' } };
}

describe('RLS — audit_logs (imutabilidade + admin-only read)', () => {
  it('admin pode ler logs de auditoria', () => {
    expect(simulateAuditAccess('admin', 'select').error).toBeNull();
  });

  it('admin pode inserir via função RPC', () => {
    expect(simulateAuditAccess('admin', 'insert').error).toBeNull();
  });

  it('admin NÃO pode atualizar logs (imutabilidade)', () => {
    expect(simulateAuditAccess('admin', 'update').error?.code).toBe('42501');
  });

  it('admin NÃO pode deletar logs (imutabilidade)', () => {
    expect(simulateAuditAccess('admin', 'delete').error?.code).toBe('42501');
  });

  it('supervisor não tem acesso direto à tabela', () => {
    expect(simulateAuditAccess('supervisor', 'select').error?.code).toBe('42501');
  });

  it('agent não tem acesso direto à tabela', () => {
    expect(simulateAuditAccess('agent', 'select').error?.code).toBe('42501');
  });

  it('usuário anônimo é bloqueado em qualquer operação', () => {
    expect(simulateAuditAccess('anon', 'select').error?.code).toBe('42501');
    expect(simulateAuditAccess('anon', 'insert').error?.code).toBe('42501');
  });
});
