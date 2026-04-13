import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

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
  const [addIPDialogOpen, setAddIPDialogOpen] = useState(false);
  const [addUserIPDialogOpen, setAddUserIPDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userIPs, setUserIPs] = useState<IPEntry[]>([]);
  const [newIP, setNewIP] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCIDR, setIsCIDR] = useState(false);

  useEffect(() => { if (isAdmin) fetchData(); }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: ips } = await supabase.from('ip_whitelist').select('*').order('created_at', { ascending: false });
      setGlobalIPs(ips || []);
      const { data: userProfiles } = await supabase.from('user_profiles').select('id, email, full_name');
      setUsers(userProfiles || []);
      const { data: restrictions } = await supabase.from('user_ip_restrictions').select('*');
      const mapped = (restrictions || []).map(r => {
        const user = userProfiles?.find(u => u.id === r.user_id);
        return { ...r, user_email: user?.email, user_name: user?.full_name };
      });
      setUserRestrictions(mapped);
      const { data: logs } = await supabase.from('blocked_access_logs').select('*').order('created_at', { ascending: false }).limit(100);
      setBlockedLogs(logs || []);
    } catch (error) {
      logger.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const validateIP = (ip: string, isCidr: boolean): boolean => {
    if (isCidr) return /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(ip);
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
  };

  const addGlobalIP = async () => {
    if (!newIP.trim()) { toast.error('IP é obrigatório'); return; }
    if (!validateIP(newIP, isCIDR)) { toast.error(isCIDR ? 'Formato CIDR inválido' : 'Formato de IP inválido'); return; }
    try {
      const { error } = await supabase.from('ip_whitelist').insert({ ip_address: newIP.trim(), description: newDescription.trim() || null, is_cidr: isCIDR, created_by: 'admin' });
      if (error) throw error;
      toast.success('IP adicionado à whitelist global');
      setNewIP(''); setNewDescription(''); setIsCIDR(false); setAddIPDialogOpen(false); fetchData();
    } catch (error: unknown) {
      if (error instanceof Object && 'code' in error && (error as { code: string }).code === '23505') toast.error('Este IP já está na whitelist');
      else toast.error('Erro ao adicionar IP');
    }
  };

  const removeGlobalIP = async (id: string) => {
    const { error } = await supabase.from('ip_whitelist').delete().eq('id', id);
    if (!error) { toast.success('IP removido da whitelist'); fetchData(); }
    else toast.error('Erro ao remover IP');
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

  const addUserIP = async () => {
    if (!selectedUserId || !newIP.trim()) { toast.error('Usuário e IP são obrigatórios'); return; }
    if (!validateIP(newIP, isCIDR)) { toast.error(isCIDR ? 'Formato CIDR inválido' : 'Formato de IP inválido'); return; }
    try {
      const { error } = await supabase.from('user_allowed_ips').insert({ user_id: selectedUserId, ip_address: newIP.trim(), description: newDescription.trim() || null, is_cidr: isCIDR });
      if (error) throw error;
      toast.success('IP adicionado para o usuário');
      setNewIP(''); setNewDescription(''); setIsCIDR(false); setAddUserIPDialogOpen(false); fetchUserIPs(selectedUserId);
    } catch (error: unknown) {
      if (error instanceof Object && 'code' in error && (error as { code: string }).code === '23505') toast.error('Este IP já está configurado para este usuário');
      else toast.error('Erro ao adicionar IP');
    }
  };

  const removeUserIP = async (id: string, userId: string) => {
    const { error } = await supabase.from('user_allowed_ips').delete().eq('id', id);
    if (!error) { toast.success('IP removido'); fetchUserIPs(userId); }
    else toast.error('Erro ao remover IP');
  };

  return {
    globalIPs, userRestrictions, blockedLogs, users, loading,
    addIPDialogOpen, setAddIPDialogOpen, addUserIPDialogOpen, setAddUserIPDialogOpen,
    selectedUserId, setSelectedUserId, userIPs,
    newIP, setNewIP, newDescription, setNewDescription, isCIDR, setIsCIDR,
    addGlobalIP, removeGlobalIP, toggleUserRestriction, fetchUserIPs, addUserIP, removeUserIP,
  };
}
