import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DataPoint {
  time: string;
  timestamp: number;
  onHold: number;
  inCall: number;
}

export const HoldTrendChart = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const maxDataPoints = 30; // Keep last 30 data points (5 minutes at 10s intervals)
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCurrentStatus = async () => {
    const [callsResult, holdsResult] = await Promise.all([
      supabase
        .from('call_sessions')
        .select('id')
        .eq('status', 'active'),
      supabase
        .from('hold_events')
        .select('call_session_id')
        .is('ended_at', null)
    ]);

    const activeCalls = callsResult.data?.length || 0;
    const activeHolds = holdsResult.data?.length || 0;
    const inCall = activeCalls - activeHolds;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setData(prev => {
      const newData = [
        ...prev,
        {
          time: timeStr,
          timestamp: now.getTime(),
          onHold: activeHolds,
          inCall: Math.max(0, inCall)
        }
      ];
      // Keep only last maxDataPoints
      if (newData.length > maxDataPoints) {
        return newData.slice(-maxDataPoints);
      }
      return newData;
    });
  };

  useEffect(() => {
    // Initial fetch
    fetchCurrentStatus();

    // Set up polling every 10 seconds
    intervalRef.current = setInterval(fetchCurrentStatus, 10000);

    // Subscribe to real-time updates for immediate refresh
    const channel = supabase
      .channel('hold-trend-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hold_events'
        },
        () => {
          fetchCurrentStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_sessions'
        },
        () => {
          fetchCurrentStatus();
        }
      )
      .subscribe();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, []);

  const currentOnHold = data.length > 0 ? data[data.length - 1].onHold : 0;
  const previousOnHold = data.length > 1 ? data[data.length - 2].onHold : 0;
  const trend = currentOnHold - previousOnHold;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolução de Chamadas em Espera
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`$
                {currentOnHold > 0 
                  ? 'border-destructive/50 text-destructive' 
                  : 'border-green-500/50 text-green-600'
              }`}
            >
              {currentOnHold} em espera
            </Badge>
            {trend !== 0 && (
              <Badge 
                variant="outline" 
                className={trend > 0 ? 'text-destructive' : 'text-green-600'}
              >
                {trend > 0 ? `+${trend}` : trend}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
          <Clock className="h-3 w-3" />
          Últimos 5 minutos (atualização a cada 10s)
        </p>
      </CardHeader>
      <CardContent>
        {data.length < 2 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm">Coletando dados...</p>
            </div>
          </div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="onHoldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="inCallGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10 }} 
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }} 
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area
                  type="monotone"
                  dataKey="inCall"
                  name="Em Chamada"
                  stroke="hsl(142, 76%, 36%)"
                  fill="url(#inCallGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="onHold"
                  name="Em Espera"
                  stroke="hsl(var(--destructive))"
                  fill="url(#onHoldGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex items-center justify-center gap-6 mt-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Em Chamada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Em Espera</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
