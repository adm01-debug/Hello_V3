import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface CallAlert {
  id: string;
  call_session_id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ContactAlert {
  id: string;
  contact_id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  trigger_data: Record<string, unknown>;
  is_read: boolean;
  is_actioned: boolean;
  actioned_at: string | null;
  actioned_by: string | null;
  created_at: string;
  contact?: { name: string; company: string | null };
}

export function useAlerts() {
  const [activeTab, setActiveTab] = useState('contacts');
  const [callAlerts, setCallAlerts] = useState<CallAlert[]>([]);
  const [filteredCallAlerts, setFilteredCallAlerts] = useState<CallAlert[]>([]);
  const [selectedCallAlerts, setSelectedCallAlerts] = useState<Set<string>>(new Set());
  const [contactAlerts, setContactAlerts] = useState<ContactAlert[]>([]);
  const [filteredContactAlerts, setFilteredContactAlerts] = useState<ContactAlert[]>([]);
  const [selectedContactAlerts, setSelectedContactAlerts] = useState<Set<string>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAlerts, setIsCheckingAlerts] = useState(false);

  useEffect(() => {
    fetchAllAlerts();
    const callChannel = supabase
      .channel('alerts_page_calls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_alerts' }, () => fetchCallAlerts())
      .subscribe();
    const contactChannel = supabase
      .channel('alerts_page_contacts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_alerts' }, () => fetchContactAlerts())
      .subscribe();
    return () => {
      supabase.removeChannel(callChannel);
      supabase.removeChannel(contactChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let result = [...callAlerts];
    if (severityFilter !== 'all') result = result.filter(a => a.severity === severityFilter);
    if (typeFilter !== 'all') result = result.filter(a => a.alert_type === typeFilter);
    if (statusFilter !== 'all') result = result.filter(a => statusFilter === 'read' ? a.is_read : !a.is_read);
    setFilteredCallAlerts(result);
  }, [callAlerts, severityFilter, typeFilter, statusFilter]);

  useEffect(() => {
    let result = [...contactAlerts];
    if (severityFilter !== 'all') result = result.filter(a => a.severity === severityFilter);
    if (typeFilter !== 'all') result = result.filter(a => a.alert_type === typeFilter);
    if (statusFilter !== 'all') {
      if (statusFilter === 'read') result = result.filter(a => a.is_read);
      else if (statusFilter === 'unread') result = result.filter(a => !a.is_read);
      else if (statusFilter === 'actioned') result = result.filter(a => a.is_actioned);
      else if (statusFilter === 'pending') result = result.filter(a => !a.is_actioned);
    }
    setFilteredContactAlerts(result);
  }, [contactAlerts, severityFilter, typeFilter, statusFilter]);

  const fetchAllAlerts = async () => {
    setIsLoading(true);
    await Promise.all([fetchCallAlerts(), fetchContactAlerts()]);
    setIsLoading(false);
  };

  const fetchCallAlerts = async () => {
    const { data, error } = await supabase.from('call_alerts').select('*').order('created_at', { ascending: false });
    if (!error) setCallAlerts(data || []);
  };

  const fetchContactAlerts = async () => {
    const { data, error } = await supabase.from('contact_alerts').select('*, contact:contacts(name, company)').order('created_at', { ascending: false });
    if (!error) setContactAlerts((data || []) as unknown as ContactAlert[]);
  };

  const checkForNewAlerts = async () => {
    setIsCheckingAlerts(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-contact-alerts');
      if (error) throw error;
      if (data?.alerts_created > 0) {
        toast.success(`${data.alerts_created} novos alertas gerados`);
        await fetchContactAlerts();
      } else {
        toast.info('Nenhum novo alerta detectado');
      }
    } catch (err) {
      logger.error('Error checking alerts:', err);
      toast.error('Erro ao verificar alertas');
    } finally {
      setIsCheckingAlerts(false);
    }
  };

  const markCallAlertAsRead = async (alertId: string) => {
    const { error } = await supabase.from('call_alerts').update({ is_read: true }).eq('id', alertId);
    if (!error) {
      setCallAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
      toast.success('Alerta marcado como lido');
    }
  };

  const markAllCallAlertsAsRead = async () => {
    const { error } = await supabase.from('call_alerts').update({ is_read: true }).eq('is_read', false);
    if (!error) {
      setCallAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      toast.success('Todos os alertas marcados como lidos');
    }
  };

  const batchMarkCallAlertsAsRead = async () => {
    if (selectedCallAlerts.size === 0) return;
    const ids = Array.from(selectedCallAlerts);
    const { error } = await supabase.from('call_alerts').update({ is_read: true }).in('id', ids);
    if (!error) {
      setCallAlerts(prev => prev.map(a => ids.includes(a.id) ? { ...a, is_read: true } : a));
      setSelectedCallAlerts(new Set());
      toast.success(`${ids.length} alertas marcados como lidos`);
    }
  };

  const markContactAlertAsRead = async (alertId: string) => {
    const { error } = await supabase.from('contact_alerts').update({ is_read: true }).eq('id', alertId);
    if (!error) setContactAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
  };

  const markContactAlertAsActioned = async (alertId: string) => {
    const { error } = await supabase.from('contact_alerts')
      .update({ is_actioned: true, actioned_at: new Date().toISOString(), actioned_by: 'Usuário' })
      .eq('id', alertId);
    if (!error) {
      setContactAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_actioned: true, actioned_at: new Date().toISOString() } : a));
      toast.success('Alerta marcado como resolvido');
    }
  };

  const deleteContactAlert = async (alertId: string) => {
    const { error } = await supabase.from('contact_alerts').delete().eq('id', alertId);
    if (!error) {
      setContactAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Alerta removido');
    }
  };

  const batchMarkContactAlertsAsRead = async () => {
    if (selectedContactAlerts.size === 0) return;
    const ids = Array.from(selectedContactAlerts);
    const { error } = await supabase.from('contact_alerts').update({ is_read: true }).in('id', ids);
    if (!error) {
      setContactAlerts(prev => prev.map(a => ids.includes(a.id) ? { ...a, is_read: true } : a));
      setSelectedContactAlerts(new Set());
      toast.success(`${ids.length} alertas marcados como lidos`);
    }
  };

  const batchMarkContactAlertsAsActioned = async () => {
    if (selectedContactAlerts.size === 0) return;
    const ids = Array.from(selectedContactAlerts);
    const { error } = await supabase.from('contact_alerts')
      .update({ is_actioned: true, actioned_at: new Date().toISOString(), actioned_by: 'Usuário' })
      .in('id', ids);
    if (!error) {
      setContactAlerts(prev => prev.map(a => ids.includes(a.id) ? { ...a, is_actioned: true, actioned_at: new Date().toISOString() } : a));
      setSelectedContactAlerts(new Set());
      toast.success(`${ids.length} alertas marcados como resolvidos`);
    }
  };

  const batchDeleteContactAlerts = async () => {
    if (selectedContactAlerts.size === 0) return;
    const ids = Array.from(selectedContactAlerts);
    const { error } = await supabase.from('contact_alerts').delete().in('id', ids);
    if (!error) {
      setContactAlerts(prev => prev.filter(a => !ids.includes(a.id)));
      setSelectedContactAlerts(new Set());
      toast.success(`${ids.length} alertas removidos`);
    }
  };

  const toggleCallAlertSelection = (id: string) => {
    setSelectedCallAlerts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleContactAlertSelection = (id: string) => {
    setSelectedContactAlerts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllCallAlerts = () => {
    setSelectedCallAlerts(prev =>
      prev.size === filteredCallAlerts.length ? new Set() : new Set(filteredCallAlerts.map(a => a.id))
    );
  };

  const selectAllContactAlerts = () => {
    setSelectedContactAlerts(prev =>
      prev.size === filteredContactAlerts.length ? new Set() : new Set(filteredContactAlerts.map(a => a.id))
    );
  };

  const createTestAlerts = async () => {
    let sessionId: string;
    const { data: existingSession } = await supabase.from('call_sessions').select('id').limit(1).maybeSingle();
    if (existingSession) {
      sessionId = existingSession.id;
    } else {
      const { data: newSession, error: sessionError } = await supabase
        .from('call_sessions')
        .insert({ caller_name: 'Cliente Teste', caller_phone: '+55 11 99999-9999', agent_name: 'Agente Teste', status: 'completed' })
        .select('id').single();
      if (sessionError || !newSession) { toast.error('Erro ao criar sessão de teste'); return; }
      sessionId = newSession.id;
    }
    const testAlerts = [
      { call_session_id: sessionId, alert_type: 'negative_sentiment', severity: 'critical', title: 'Sentimento Negativo Detectado', message: 'Cliente expressou frustração durante a chamada.' },
      { call_session_id: sessionId, alert_type: 'low_satisfaction', severity: 'warning', title: 'Satisfação Baixa', message: 'Pontuação de satisfação do cliente: 2/10.' },
      { call_session_id: sessionId, alert_type: 'high_urgency', severity: 'critical', title: 'Alta Urgência', message: 'Chamada marcada como urgente.' },
    ];
    const { error } = await supabase.from('call_alerts').insert(testAlerts);
    if (!error) toast.success('3 alertas de teste criados!');
    else toast.error('Erro ao criar alertas de teste');
  };

  const callUnreadCount = callAlerts.filter(a => !a.is_read).length;
  const callCriticalCount = callAlerts.filter(a => a.severity === 'critical' && !a.is_read).length;
  const contactUnreadCount = contactAlerts.filter(a => !a.is_read).length;
  const contactPendingCount = contactAlerts.filter(a => !a.is_actioned).length;
  const contactCriticalCount = contactAlerts.filter(a => a.severity === 'critical' && !a.is_actioned).length;
  const totalUnread = callUnreadCount + contactUnreadCount;
  const totalCritical = callCriticalCount + contactCriticalCount;

  return {
    activeTab, setActiveTab,
    callAlerts, filteredCallAlerts, selectedCallAlerts,
    contactAlerts, filteredContactAlerts, selectedContactAlerts,
    severityFilter, setSeverityFilter, typeFilter, setTypeFilter, statusFilter, setStatusFilter,
    isLoading, isCheckingAlerts,
    checkForNewAlerts, markCallAlertAsRead, markAllCallAlertsAsRead, batchMarkCallAlertsAsRead,
    markContactAlertAsRead, markContactAlertAsActioned, deleteContactAlert,
    batchMarkContactAlertsAsRead, batchMarkContactAlertsAsActioned, batchDeleteContactAlerts,
    toggleCallAlertSelection, toggleContactAlertSelection,
     selectAllCallAlerts, selectAllContactAlerts, createTestAlerts, fetchAllAlerts,
    callUnreadCount, callCriticalCount, contactUnreadCount, contactPendingCount, contactCriticalCount,
    totalUnread, totalCritical,
  };
}
