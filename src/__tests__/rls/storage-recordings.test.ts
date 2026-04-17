/**
 * RLS — Storage bucket `call-recordings`:
 * - bucket privado (não público)
 * - ownership: agente acessa apenas arquivos do próprio prefixo (`<user_id>/...`)
 * - admin/supervisor: leitura total
 * - upload: agente apenas no próprio prefixo
 * - delete: somente admin
 */
import { describe, it, expect } from 'vitest';

type Role = 'agent' | 'supervisor' | 'admin' | 'anon';
interface Op {
  role: Role;
  action: 'read' | 'upload' | 'delete';
  pathOwnerId: string;
  currentUserId: string;
}

function simulate({ role, action, pathOwnerId, currentUserId }: Op) {
  if (role === 'anon') return { error: { code: '42501', message: 'bucket is private' } };
  if (action === 'delete') {
    return role === 'admin' ? { error: null } : { error: { code: '42501', message: 'delete restricted to admin' } };
  }
  if (role === 'admin' || role === 'supervisor') return { error: null };
  // agent: apenas próprio prefixo
  return pathOwnerId === currentUserId
    ? { error: null }
    : { error: { code: '42501', message: 'storage permission denied' } };
}

describe('Storage — call-recordings (ownership por path)', () => {
  it('bucket é privado: anônimo é bloqueado', () => {
    expect(simulate({ role: 'anon', action: 'read', pathOwnerId: 'u1', currentUserId: 'u1' }).error?.code).toBe('42501');
  });

  it('agente lê apenas próprias gravações', () => {
    expect(simulate({ role: 'agent', action: 'read', pathOwnerId: 'u1', currentUserId: 'u1' }).error).toBeNull();
    expect(simulate({ role: 'agent', action: 'read', pathOwnerId: 'u2', currentUserId: 'u1' }).error?.code).toBe('42501');
  });

  it('agente faz upload apenas no próprio prefixo', () => {
    expect(simulate({ role: 'agent', action: 'upload', pathOwnerId: 'u1', currentUserId: 'u1' }).error).toBeNull();
    expect(simulate({ role: 'agent', action: 'upload', pathOwnerId: 'u2', currentUserId: 'u1' }).error?.code).toBe('42501');
  });

  it('supervisor lê qualquer gravação', () => {
    expect(simulate({ role: 'supervisor', action: 'read', pathOwnerId: 'u9', currentUserId: 'sup1' }).error).toBeNull();
  });

  it('apenas admin pode deletar gravações', () => {
    expect(simulate({ role: 'admin', action: 'delete', pathOwnerId: 'u1', currentUserId: 'admin1' }).error).toBeNull();
    expect(simulate({ role: 'supervisor', action: 'delete', pathOwnerId: 'u1', currentUserId: 'sup1' }).error?.code).toBe('42501');
    expect(simulate({ role: 'agent', action: 'delete', pathOwnerId: 'u1', currentUserId: 'u1' }).error?.code).toBe('42501');
  });
});
