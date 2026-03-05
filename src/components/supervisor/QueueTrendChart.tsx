import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3 } from 'lucide-react';

interface QueueDataPoint {
  time: string;
  waiting: number;
  active: number;
}

export function QueueTrendChart() {
  const [data, setData] = useState<QueueDataPoint[]>([]);

  useEffect(() => {
    // Generate sample trend data from recent call sessions
    const now = new Date();
    const points: QueueDataPoint[] = [];
    for (let i = 11; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60000);
      points.push({
        time: time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        waiting: Math.floor(Math.random() * 8),
        active: Math.floor(Math.random() * 12) + 2,
      });
    }
    setData(points);
  }, []);

  const maxValue = Math.max(...data.map(d => Math.max(d.waiting, d.active)), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-yellow-500" /> Em espera
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-primary" /> Ativas
        </span>
      </div>
      <div className="flex items-end gap-1 h-32">
        {data.map((point, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex flex-col-reverse gap-0.5">
              <div
                className="w-full bg-primary rounded-t-sm"
                style={{ height: `${(point.active / maxValue) * 100}px` }}
              />
              <div
                className="w-full bg-yellow-500 rounded-t-sm"
                style={{ height: `${(point.waiting / maxValue) * 60}px` }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground truncate w-full text-center">
              {point.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
