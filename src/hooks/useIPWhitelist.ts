import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { mensagemDeErro } from '@/lib/error-message';

export interface IPEntry {
  id: string;
  ip_address: string;
  description: string | null;
  is_cidr: boolean;
  created_at: string;
  created_by?: string | null;
}

export interface UserRestriction {
  id: string;
  user_id: string;
  enabled: boolean;
  user_email?: string;
  user_name?: string | null;
}

export interface BlockedLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  ip_address: string;
  reason: string;
  user_agent: string | null;
  created_at: string;
}

export function useIPWhitelist(isAdmin: boolean) {
  const [globalIPs, setGlobalIPs] = useState<IPEntry[]>([]);
  const [userRestrictions, setUserRestrictions] = useState<UserRestriction[]>([]);
  const [blockedLogs, setBlockedLogs] = useState<BlockedLog[]>([]);
  const [users, setUsers] = useState<{ id: string; email: string; full_name: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [userIPs, setUserIPs] = useState<IPEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: ips, error: ipsError } = await supabase.from('ip_whitelist').select('*').order('created_at', { ascending: false });
      const { data: userProfiles, error: usersError } = await supabase.from('user_profiles').select('id, email, full_name');
      const { data: restrictions, error: restrictionsError } = await supabase.from('user_ip_restrictions').select('*');
      const { data: logs, error: logsError } = await supabase.from('blocked_access_logs').select('*').order('created_at', { ascending: false }).limit(100);

      // Lista de IPs vazia por falha de consulta faz o admin concluir que nao
      // existe restricao configurada — a acao dele e o oposto do caso real.
      const falhaLeitura = ipsError || usersError || restrictionsError || logsError;
      if (falhaLeitura) {
        logger.error('Error fetching data:', falhaLeitura);
        setError(mensagemDeErro(falhaLeitura));
        toast.error('Erro ao carregar dados');
        return;
      }
      setError(null);

      setGlobalIPs(ips || []);
      setUsers(userProfiles || []);

      const mappedRestrictions = (restrictions || []).map(r => {
        const user = userProfiles?.find(u => u.id === r.user_id);
        return { ...r, user_email: user?.email, user_name: user?.full_name };
      });
      setUserRestrictions(mappedRestrictions);

      setBlockedLogs(logs || []);
    } catch (error) {
      logger.error('Error fetching data:', error);
      setError(mensagemDeErro(error));
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const validateIP = (ip: string, isCidr: boolean): boolean => {
    const regex = isCidr ? /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/ : /^(\d{1,3}\.){3}\d{1,3}$/;
    return regex.test(ip);
  };

  const addGlobalIP = async (ip: string, description: string, isCIDR: boolean) => {
    if (!ip.trim()) { toast.error('IP é obrigatório'); return false; }
    if (!validateIP(ip, isCIDR)) { toast.error(isCIDR ? 'Formato CIDR inválido (ex: 192.168.1.0/24)' : 'Formato de IP inválido (ex: 192.168.1.100)'); return false; }
    try {
      const { error } = await supabase.from('ip_whitelist').insert({ ip_address: ip.trim(), description: description.trim() || null, is_cidr: isCIDR, created_by: 'admin' });
      if (error) throw error;
      toast.success('IP adicionado à whitelist global');
      fetchData();
      return true;
    } catch (error: unknown) {
      if (error instanceof Object && 'code' in error && (error as { code: string }).code === '23505') toast.error('Este IP já está na whitelist');
      else toast.error('Erro ao adicionar IP');
      return false;
    }
  };

  const removeGlobalIP = async (id: string) => {
    try {
      const { error } = await supabase.from('ip_whitelist').delete().eq('id', id);
      if (error) throw error;
      toast.success('IP removido da whitelist');
      fetchData();
    } catch { toast.error('Erro ao remover IP'); }
  };

  const toggleUserRestriction = async (userId: string, enabled: boolean) => {
    try {
      const existing = userRestrictions.find(r => r.user_id === userId);
      if (existing) {
        const { error } = await supabase.from('user_ip_restrictions').update({ enabled }).eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_ip_restrictions').insert({ user_id: userId, enabled });
        if (error) throw error;
      }
      toast.success(enabled ? 'Restrição de IP habilitada' : 'Restrição de IP desabilitada');
      fetchData();
    } catch { toast.error('Erro ao atualizar restrição'); }
  };

  const fetchUserIPs = async (userId: string) => {
    const { data } = await supabase.from('user_allowed_ips').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setUserIPs(data || []);
  };

  const addUserIP = async (userId: string, ip: string, description: string, isCIDR: boolean) => {
    if (!userId || !ip.trim()) { toast.error('Usuário e IP são obrigatórios'); return false; }
    if (!validateIP(ip, isCIDR)) { toast.error(isCIDR ? 'Formato CIDR inválido' : 'Formato de IP inválido'); return false; }
    try {
      const { error } = await supabase.from('user_allowed_ips').insert({ user_id: userId, ip_address: ip.trim(), description: description.trim() || null, is_cidr: isCIDR });
      if (error) throw error;
      toast.success('IP adicionado para o usuário');
      fetchUserIPs(userId);
      return true;
    } catch (error: unknown) {
      if (error instanceof Object && 'code' in error && (error as { code: string }).code === '23505') toast.error('Este IP já está configurado para este usuário');
      else toast.error('Erro ao adicionar IP');
      return false;
    }
  };

  const removeUserIP = async (id: string, userId: string) => {
    try {
      const { error } = await supabase.from('user_allowed_ips').delete().eq('id', id);
      if (error) throw error;
      toast.success('IP removido');
      fetchUserIPs(userId);
    } catch { toast.error('Erro ao remover IP'); }
  };

  return {
    globalIPs, userRestrictions, blockedLogs, users, loading, userIPs, error,
    addGlobalIP, removeGlobalIP, toggleUserRestriction, fetchUserIPs, addUserIP, removeUserIP,
  };
}
