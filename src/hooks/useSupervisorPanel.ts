 import { useEffect, useState } from 'react';
 import { formatDuration } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCriticalAlertNotifications, AlertSoundConfig } from '@/hooks/useCriticalAlertNotifications';
import { logger } from '@/lib/logger';
import type { Json } from '@/integrations/supabase/types';

import { safeToLocaleTimeString } from "@/lib/safe-date";
/** Nome do usuário logado para atribuir a sessão de escuta; cai no e-mail e depois em 'Supervisor'. */
function useSupervisorName(): string {
  const [nome, setNome] = useState('Supervisor');
  useEffect(() => {
    let cancelado = false;
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const usuario = auth?.user;
      if (!usuario || cancelado) return;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', usuario.id)
        .maybeSingle();
      if (error || cancelado) return;
      const resolvido = data?.full_name?.trim() || usuario.email || 'Supervisor';
      if (!cancelado) setNome(resolvido);
    })();
    return () => { cancelado = true; };
  }, []);
  return nome;
}

export interface ActiveCall {
  id: string;
  caller_name: string | null;
  caller_phone: string | null;
  agent_name: string | null;
  started_at: string;
  status: string | null;
  hold_time_seconds: number | null;
}

export interface WhisperMessage {
  id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export interface BargeInSession {
  id: string;
  call_session_id: string;
  supervisor_name: string;
  agent_name: string;
  status: string;
  started_at: string;
}

export interface SupervisorQueueMetrics {
  avgWaitTime: number;
  abandonmentRate: number;
  totalCompleted: number;
  totalAbandoned: number;
  longestWait: number;
  serviceLevelPercent: number;
}

export function useSupervisorPanel() {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [selectedCall, setSelectedCall] = useState<ActiveCall | null>(null);
  const [whisperMessage, setWhisperMessage] = useState('');
  const [whisperHistory, setWhisperHistory] = useState<WhisperMessage[]>([]);
  const [activeBargeIn, setActiveBargeIn] = useState<BargeInSession | null>(null);
  const [activeListen, setActiveListen] = useState<BargeInSession | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTrendChart, setShowTrendChart] = useState(false);
  const DEFAULT_SOUND_CONFIG: AlertSoundConfig = {
    warningFrequency: 520, warningPattern: 'single', warningVolume: 0.2,
    criticalFrequency: 880, criticalPattern: 'urgent', criticalVolume: 0.3,
  };
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('supervisor-sound-enabled');
      if (saved === null) return true;
      const parsed = JSON.parse(saved);
      return typeof parsed === 'boolean' ? parsed : true;
    } catch {
      return true;
    }
  });
  const [soundConfig, setSoundConfig] = useState<AlertSoundConfig>(() => {
    try {
      const saved = localStorage.getItem('supervisor-sound-config');
      if (!saved) return DEFAULT_SOUND_CONFIG;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { ...DEFAULT_SOUND_CONFIG, ...parsed };
      }
      return DEFAULT_SOUND_CONFIG;
    } catch {
      return DEFAULT_SOUND_CONFIG;
    }
  });
  const [queueMetrics, setQueueMetrics] = useState<SupervisorQueueMetrics>({
    avgWaitTime: 0, abandonmentRate: 0, totalCompleted: 0,
    totalAbandoned: 0, longestWait: 0, serviceLevelPercent: 0,
  });
  const supervisorName = useSupervisorName();

  const { requestNotificationPermission, initAudioContext, playAlertSound } =
    useCriticalAlertNotifications({
      enabled: true, soundEnabled, browserNotificationsEnabled: true, soundConfig,
    });

  const handleSoundEnabledChange = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('supervisor-sound-enabled', JSON.stringify(enabled));
  };

  const handleSoundConfigChange = (config: AlertSoundConfig) => {
    setSoundConfig(config);
    localStorage.setItem('supervisor-sound-config', JSON.stringify(config));
  };

  const handleEnableSound = async () => {
    initAudioContext();
    handleSoundEnabledChange(true);
    const granted = await requestNotificationPermission();
    toast[granted ? 'success' : 'info'](granted ? 'Notificações ativadas' : 'Notificações sonoras ativadas.');
    playAlertSound('warning');
  };

  const fetchActiveCalls = async () => {
    const { data, error } = await supabase.from('call_sessions').select('*').eq('status', 'active').order('started_at', { ascending: false });
    if (!error && data) setActiveCalls(data);
    setLoading(false);
  };

  const fetchQueueMetrics = async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const { data: completedCalls, error: ce } = await supabase.from('call_sessions').select('duration_seconds, hold_time_seconds, started_at, ended_at').eq('status', 'completed').gte('created_at', today.toISOString());
    const { data: abandonedCalls, error: ae } = await supabase.from('call_sessions').select('*').in('status', ['abandoned', 'missed']).gte('created_at', today.toISOString());
    if (!ce && !ae) {
      const completed = completedCalls || []; const abandoned = abandonedCalls || [];
      const total = completed.length + abandoned.length;
      const totalHoldTime = completed.reduce((s, c) => s + (c.hold_time_seconds || 0), 0);
      const avgWaitTime = completed.length > 0 ? Math.round(totalHoldTime / completed.length) : 0;
      const longestWait = completed.reduce((m, c) => Math.max(m, c.hold_time_seconds || 0), 0);
      const abandonmentRate = total > 0 ? Math.round((abandoned.length / total) * 100) : 0;
      const answeredQuickly = completed.filter(c => (c.hold_time_seconds || 0) <= 30).length;
      const serviceLevelPercent = completed.length > 0 ? Math.round((answeredQuickly / completed.length) * 100) : 100;
      setQueueMetrics({ avgWaitTime, abandonmentRate, totalCompleted: completed.length, totalAbandoned: abandoned.length, longestWait, serviceLevelPercent });
    }
  };

  const fetchActiveBargeIn = async () => {
    const { data, error } = await supabase.from('barge_in_sessions').select('*').eq('supervisor_name', supervisorName).eq('status', 'active').maybeSingle();
    if (!error && data) setActiveBargeIn(data);
  };

  const fetchWhisperHistory = async (callId: string) => {
    const { data, error } = await supabase.from('whisper_messages').select('*').eq('call_session_id', callId).order('created_at', { ascending: false }).limit(20);
    if (!error && data) setWhisperHistory(data);
  };

  useEffect(() => {
    fetchActiveCalls(); fetchActiveBargeIn(); fetchQueueMetrics();
    const channel = supabase.channel('supervisor-panel-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_sessions' }, () => { fetchActiveCalls(); fetchQueueMetrics(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barge_in_sessions' }, () => fetchActiveBargeIn())
      .subscribe();
    const metricsInterval = setInterval(fetchQueueMetrics, 30000);
    return () => { supabase.removeChannel(channel); clearInterval(metricsInterval); };
  }, []);

  useEffect(() => {
    if (selectedCall) {
      fetchWhisperHistory(selectedCall.id);
      const channel = supabase.channel(`whisper-history-${selectedCall.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whisper_messages', filter: `call_session_id=eq.${selectedCall.id}` }, () => fetchWhisperHistory(selectedCall.id))
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedCall]);

  const sendWhisper = async () => {
    if (!selectedCall || !whisperMessage.trim() || !selectedCall.agent_name) {
      toast.error('Selecione uma chamada e digite uma mensagem'); return;
    }
    setSending(true);
    const { error } = await supabase.from('whisper_messages').insert({
      call_session_id: selectedCall.id, supervisor_name: supervisorName,
      agent_name: selectedCall.agent_name, message: whisperMessage.trim(),
    });
    if (error) toast.error('Erro ao enviar whisper');
    else { toast.success('Whisper enviado para ' + selectedCall.agent_name); setWhisperMessage(''); }
    setSending(false);
  };

  const startBargeIn = async () => {
    if (!selectedCall || !selectedCall.agent_name) { toast.error('Selecione uma chamada primeiro'); return; }
    const { error } = await supabase.from('barge_in_sessions').insert({
      call_session_id: selectedCall.id, supervisor_name: supervisorName,
      agent_name: selectedCall.agent_name, status: 'active',
    });
    if (error) { logger.error('Error starting barge-in:', error); toast.error('Erro ao iniciar barge-in'); }
    else toast.success(`Você entrou na chamada com ${selectedCall.agent_name}`);
  };

  const endBargeIn = async () => {
    if (!activeBargeIn) return;
    const { error } = await supabase.from('barge_in_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', activeBargeIn.id);
    if (error) toast.error('Erro ao sair da chamada');
    else { setActiveBargeIn(null); toast.info('Você saiu da conferência'); }
  };

  const auditOrWarn = async (entry: {
    call_session_id: string;
    event_type: 'listen_start' | 'listen_stop';
    source: string;
    details: Json;
  }): Promise<boolean> => {
    const { error } = await supabase.from('call_control_audit_logs').insert(entry);
    if (error) {
      logger.error('Falha ao gravar auditoria de controle de chamada', { entry, error });
      toast.warning('Ação concluída, mas não foi registrada na auditoria');
      return false;
    }
    return true;
  };

  const startListening = async () => {
    if (!selectedCall || !selectedCall.agent_name) { toast.error('Selecione uma chamada primeiro'); return; }
    if (activeListen) return;
    const { data, error } = await supabase.from('barge_in_sessions').insert({
      call_session_id: selectedCall.id, supervisor_name: supervisorName,
      agent_name: selectedCall.agent_name, status: 'listening',
    }).select('id, call_session_id, supervisor_name, agent_name, status, started_at').maybeSingle();
    if (error) {
      logger.error('Error starting listen session:', error);
      toast.error('Erro ao registrar sessão de escuta');
      return;
    }
    const audited = await auditOrWarn({
      call_session_id: selectedCall.id,
      event_type: 'listen_start',
      source: 'supervisor_panel',
      details: { supervisor: supervisorName, agent: selectedCall.agent_name },
    });
    if (data) setActiveListen(data as BargeInSession);
    if (audited) toast.success(`Escuta registrada na chamada de ${selectedCall.agent_name}`);
  };

  const stopListening = async () => {
    if (!activeListen) return;
    const { error } = await supabase.from('barge_in_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', activeListen.id);
    if (error) {
      toast.error('Erro ao encerrar sessão de escuta');
      return;
    }
    await auditOrWarn({
      call_session_id: activeListen.call_session_id,
      event_type: 'listen_stop',
      source: 'supervisor_panel',
      details: { supervisor: supervisorName, agent: activeListen.agent_name },
    });
    setActiveListen(null);
    toast.info('Sessão de escuta encerrada');
  };

  const formatTime = (dateStr: string) => safeToLocaleTimeString(dateStr, 'pt-BR', { hour: '2-digit', minute: '2-digit' });

   const isCallInBargeIn = (callId: string) => activeBargeIn?.call_session_id === callId;

  const quickWhispers = [
    "Ofereça desconto de 10%", "Transfira para o setor técnico",
    "Peça para aguardar", "Confirme os dados do cliente", "Finalize a ligação",
  ];

  return {
    activeCalls, selectedCall, setSelectedCall,
    whisperMessage, setWhisperMessage, whisperHistory,
    activeBargeIn, sending, loading,
    activeListen, startListening, stopListening,
    showTrendChart, setShowTrendChart,
    soundEnabled, soundConfig, queueMetrics,
    handleSoundEnabledChange, handleSoundConfigChange, handleEnableSound,
    sendWhisper, startBargeIn, endBargeIn,
     formatTime,
     isCallInBargeIn,
     getCallDuration: (startedAt: string) => {
       const seconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
       return formatDuration(seconds);
     },
     formatWaitTime: (seconds: number) => formatDuration(seconds),
     quickWhispers,
     playAlertSound,
   };
}
