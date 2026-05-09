import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrunkPerformance {
  trunkId: string;
  occupancy: number; // 0-100
  latency: number; // ms
  activeCallsCount: number;
}

export function useTrunkRealtimeMetrics() {
  const [activeCalls, setActiveCalls] = useState<any[]>([]);
  const [trunks, setTrunks] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [callsRes, trunksRes] = await Promise.all([
        supabase.from('call_sessions').select('id, status').eq('status', 'active'),
        supabase.from('voip_trunks').select('id, name, max_channels, last_health_latency_ms, last_health_status')
      ]);
      if (callsRes.data) setActiveCalls(callsRes.data);
      if (trunksRes.data) setTrunks(trunksRes.data);
    };

    fetchData();

    // Em cenário real, call_sessions teria trunk_id. 
    // Como estamos simulando a ocupação para a UI:
    const channel = supabase.channel('trunk-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_sessions' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voip_trunks' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const metrics = useMemo(() => {
    return trunks.map(t => {
      // Simulação: distribuímos as chamadas ativas entre os troncos para visualização
      const count = activeCalls.length > 0 ? Math.ceil(activeCalls.length / (trunks.length || 1)) : 0;
      const occupancy = t.max_channels > 0 ? (count / t.max_channels) * 100 : 0;
      
      return {
        trunkId: t.id,
        trunkName: t.name,
        occupancy: Math.min(100, occupancy),
        latency: t.last_health_latency_ms || 0,
        activeCallsCount: count,
        maxChannels: t.max_channels,
        status: t.last_health_status
      };
    });
  }, [activeCalls, trunks]);

  return { metrics, totalActive: activeCalls.length };
}
