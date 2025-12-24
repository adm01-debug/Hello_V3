import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp } from 'lucide-react';

interface HourlyMetric {
  hour: string;
  avgWaitTime: number;
  abandonmentRate: number;
  serviceLevelPercent: number;
  totalCalls: number;
}

export const QueueTrendChart = () => {
  const [hourlyData, setHourlyData] = useState<HourlyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHourlyMetrics = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: allCalls, error } = await supabase
      .from('call_sessions')
      .select('status, hold_time_seconds, created_at')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: true });

    if (error || !allCalls) {
      setLoading(false);
      return;
    }

    // Group calls by hour
    const hourlyGroups: { [key: number]: typeof allCalls } = {};
    
    allCalls.forEach(call => {
      const hour = new Date(call.created_at).getHours();
      if (!hourlyGroups[hour]) {
        hourlyGroups[hour] = [];
      }
      hourlyGroups[hour].push(call);
    });

    // Calculate metrics for each hour
    const currentHour = new Date().getHours();
    const metrics: HourlyMetric[] = [];

    for (let h = 8; h <= currentHour; h++) {
      const calls = hourlyGroups[h] || [];
      const completed = calls.filter(c => c.status === 'completed');
      const abandoned = calls.filter(c => c.status === 'abandoned' || c.status === 'missed');
      const total = completed.length + abandoned.length;

      const totalHoldTime = completed.reduce((sum, c) => sum + (c.hold_time_seconds || 0), 0);
      const avgWaitTime = completed.length > 0 ? Math.round(totalHoldTime / completed.length) : 0;
      const abandonmentRate = total > 0 ? Math.round((abandoned.length / total) * 100) : 0;
      const answeredQuickly = completed.filter(c => (c.hold_time_seconds || 0) <= 30).length;
      const serviceLevelPercent = completed.length > 0 ? Math.round((answeredQuickly / completed.length) * 100) : 100;

      metrics.push({
        hour: `${h.toString().padStart(2, '0')}:00`,
        avgWaitTime,
        abandonmentRate,
        serviceLevelPercent,
        totalCalls: total
      });
    }

    setHourlyData(metrics);
    setLoading(false);
  };

  useEffect(() => {
    fetchHourlyMetrics();

    const interval = setInterval(fetchHourlyMetrics, 60000); // Refresh every minute

    const channel = supabase
      .channel('queue-trend-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_sessions' }, fetchHourlyMetrics)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-[180px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
      </div>
    );
  }

  if (hourlyData.length === 0) {
    return (
      <div className="h-[180px] flex flex-col items-center justify-center text-muted-foreground">
        <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">Sem dados de tendência disponíveis</p>
      </div>
    );
  }

  return (
    <div className="h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorWait" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorAbandonment" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorService" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="hour" 
            tick={{ fontSize: 10 }} 
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <YAxis 
            tick={{ fontSize: 10 }} 
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'avgWaitTime') return [`${value}s`, 'Espera Média'];
              if (name === 'abandonmentRate') return [`${value}%`, 'Taxa Abandono'];
              if (name === 'serviceLevelPercent') return [`${value}%`, 'Nível Serviço'];
              return [value, name];
            }}
            labelFormatter={(label) => `Horário: ${label}`}
          />
          <Legend 
            wrapperStyle={{ fontSize: '10px' }}
            formatter={(value) => {
              if (value === 'avgWaitTime') return 'Espera (s)';
              if (value === 'abandonmentRate') return 'Abandono %';
              if (value === 'serviceLevelPercent') return 'Serviço %';
              return value;
            }}
          />
          <Area
            type="monotone"
            dataKey="avgWaitTime"
            stroke="hsl(var(--primary))"
            fillOpacity={1}
            fill="url(#colorWait)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="abandonmentRate"
            stroke="hsl(var(--destructive))"
            fillOpacity={1}
            fill="url(#colorAbandonment)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="serviceLevelPercent"
            stroke="hsl(142.1 76.2% 36.3%)"
            fillOpacity={1}
            fill="url(#colorService)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
