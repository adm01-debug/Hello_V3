import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';
import type { UserRoleRow } from './types';

export function useRoles(currentUserId: string | undefined) {
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<UserRoleRow[]>([]);

  const loadUserRoles = useCallback(async () => {
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('granted_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set(roles?.map((r) => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      const enriched = roles?.map((role) => ({
        ...role,
        user_email: profileMap.get(role.user_id)?.email,
        user_name: profileMap.get(role.user_id)?.full_name,
      })) || [];

      setUserRoles(enriched as UserRoleRow[]);
    } catch (error) {
      logger.error('Error loading roles:', error);
      toast.error('Erro ao carregar roles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserRoles();
  }, [loadUserRoles]);

  const addRole = useCallback(async (email: string, role: string) => {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (profileError || !profile) {
      toast.error('Usuário não encontrado', { description: 'Verifique o email e tente novamente.' });
      return false;
    }

    const { error } = await supabase.from('user_roles').insert({
      user_id: profile.id,
      role: role as Database['public']['Enums']['app_role'],
      granted_by: currentUserId,
      is_active: true,
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('Role já existe', { description: 'Este usuário já possui esta role.' });
      } else {
        toast.error('Erro ao adicionar role', { description: error.message });
      }
      return false;
    }

    toast.success('Role adicionada com sucesso!');
    await loadUserRoles();
    return true;
  }, [currentUserId, loadUserRoles]);

  const removeRole = useCallback(async (roleId: string) => {
    try {
      const { error } = await supabase.from('user_roles').delete().eq('id', roleId);
      if (error) throw error;
      toast.success('Role removida');
      await loadUserRoles();
    } catch (error: unknown) {
      toast.error('Erro ao remover role', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }, [loadUserRoles]);

  const toggleRoleStatus = useCallback(async (roleId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: !currentStatus })
        .eq('id', roleId);
      if (error) throw error;
      toast.success(currentStatus ? 'Role desativada' : 'Role ativada');
      await loadUserRoles();
    } catch {
      toast.error('Erro ao atualizar role');
    }
  }, [loadUserRoles]);

  return { isLoading, userRoles, addRole, removeRole, toggleRoleStatus };
}
