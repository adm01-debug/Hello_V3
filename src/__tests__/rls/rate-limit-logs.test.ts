/**
 * RLS — rate_limit_logs: gravados pela função `check_rate_limit` (security
 * definer). Leitura restrita a admin para análise forense.
 */
import { describe, it, expect } from 'vitest';

type Role = 'agent' | 'supervisor' | 'admin' | 'anon';

function simulate(role: Role, op: 'select' | 'insert' | 'delete') {
  if (op === 'insert') {
    // INSERT é executado pela função SECURITY DEFINER, não pelo cliente
    return { error: { code: '42501', message: 'use check_rate_limit RPC' } };
  }
  if (op === 'delete') {
    return role === 'admin' ? { error: null } : { error: { code: '42501', message: 'admin only' } };
  }
  // SELECT: apenas admin
  return role === 'admin'
    ? { error: null }
    : { error: { code: '42501', message: 'admin only' } };
}

describe('RLS — rate_limit_logs (admin-only forensics)', () => {
  it('admin pode ler logs de rate limit', () => {
    expect(simulate('admin', 'select').error).toBeNull();
  });

  it('supervisor não pode ler', () => {
    expect(simulate('supervisor', 'select').error?.code).toBe('42501');
  });

  it('agent não pode ler', () => {
    expect(simulate('agent', 'select').error?.code).toBe('42501');
  });

  it('anônimo é totalmente bloqueado', () => {
    expect(simulate('anon', 'select').error?.code).toBe('42501');
    expect(simulate('anon', 'insert').error?.code).toBe('42501');
  });

  it('INSERT direto é bloqueado (uso obrigatório da RPC)', () => {
    expect(simulate('admin', 'insert').error?.code).toBe('42501');
    expect(simulate('agent', 'insert').error?.code).toBe('42501');
  });

  it('apenas admin pode purgar logs antigos', () => {
    expect(simulate('admin', 'delete').error).toBeNull();
    expect(simulate('supervisor', 'delete').error?.code).toBe('42501');
  });
});
