import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useHoldSoundAlert } from '@/hooks/useHoldSoundAlert';

interface ActiveCall {
  id: string;
  caller_name: string | null;
  caller_phone: string | null;
  agent_name: string | null;
  started_at: string;
  status: string | null;
  hold_time_seconds: number | null;
  hold_count: number | null;
}

interface ActiveHoldEvent {
  id: string;
  call_session_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
}

export function useActiveCallsRealtime() {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [activeHolds, setActiveHolds] = useState<ActiveHoldEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedHoldStatus, setSelectedHoldStatus] = useState('all');
  const [, setTick] = useState(0);

  const { soundEnabled, toggleSound, settings } = useHoldSoundAlert(activeHolds);

  const fetchActiveCalls = async () => {
    const { data, error } = await supabase.from('call_sessions').select('*').eq('status', 'active').order('started_at', { ascending: false });
    if (!error && data) setActiveCalls(data);
  };

  const fetchActiveHolds = async () => {
    const { data, error } = await supabase.from('hold_events').select('*').is('ended_at', null).order('started_at', { ascending: false });
    if (!error && data) setActiveHolds(data);
  };

  useEffect(() => {
    const loadData = async () => { setLoading(true); await Promise.all([fetchActiveCalls(), fetchActiveHolds()]); setLoading(false); };
    loadData();
    const channel = supabase.channel('active-calls-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_sessions' }, () => fetchActiveCalls())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hold_events' }, () => fetchActiveHolds())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { const interval = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(interval); }, []);

  const isCallOnHold = (callId: string) => activeHolds.some(h => h.call_session_id === callId);

  const getHoldDuration = (callId: string) => {
    const hold = activeHolds.find(h => h.call_session_id === callId);
    if (!hold) return 0;
    return Math.floor((Date.now() - new Date(hold.started_at).getTime()) / 1000);
  };

  const getHoldSeverity = (holdDuration: number): 'normal' | 'warning' | 'critical' => {
    if (holdDuration >= settings.critical_threshold_seconds) return 'critical';
    if (holdDuration >= settings.warning_threshold_seconds) return 'warning';
    return 'normal';
  };

  const agents = useMemo(() => {
    const names = activeCalls.map(c => c.agent_name).filter((n): n is string => !!n);
    return [...new Set(names)].sort();
  }, [activeCalls]);

  const statusCounts = useMemo(() => {
    const callsOnHold = activeCalls.filter(c => isCallOnHold(c.id));
    let hasCritical = false, hasWarning = false;
    callsOnHold.forEach(c => { const s = getHoldSeverity(getHoldDuration(c.id)); if (s === 'critical') hasCritical = true; if (s === 'warning') hasWarning = true; });
    return { onHold: callsOnHold.length, inCall: activeCalls.length - callsOnHold.length, total: activeCalls.length, maxSeverity: hasCritical ? 'critical' : hasWarning ? 'warning' : 'normal' };
  }, [activeCalls, activeHolds]);

  const filteredCalls = useMemo(() => {
    let filtered = activeCalls;
    if (selectedAgent !== 'all') filtered = filtered.filter(c => c.agent_name === selectedAgent);
    if (selectedHoldStatus === 'on_hold') filtered = filtered.filter(c => isCallOnHold(c.id));
    else if (selectedHoldStatus === 'in_call') filtered = filtered.filter(c => !isCallOnHold(c.id));
    return filtered;
  }, [activeCalls, selectedAgent, selectedHoldStatus, activeHolds]);

  return {
    loading, filteredCalls, agents, statusCounts,
    selectedAgent, setSelectedAgent, selectedHoldStatus, setSelectedHoldStatus,
    soundEnabled, toggleSound,
    isCallOnHold, getHoldDuration, getHoldSeverity,
  };
}
