import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useTrunkHealthHistory } from '@/hooks/useTrunkHealth';
import { Loader2, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

import { safeToLocaleString, safeToLocaleTimeString } from "@/lib/safe-date";
interface Props {
  trunkId: string | null;
  trunkName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrunkHealthHistoryDrawer({ trunkId, trunkName, open, onOpenChange }: Props) {
  const { data: history = [], isLoading } = useTrunkHealthHistory(trunkId, 24);

  const chartData = useMemo(
    () => history.map(h => ({
      time: safeToLocaleTimeString(h.checked_at, 'pt-BR', { hour: '2-digit', minute: '2-digit' }),
      latency: h.reachable ? h.latency_ms ?? 0 : 0,
      reachable: h.reachable ? 1 : 0,
    })),
    [history],
  );

  const reachableCount = history.filter(h => h.reachable).length;
  const uptime = history.length ? Math.round((reachableCount / history.length) * 100) : 0;
  const avgLatency = history.filter(h => h.reachable && h.latency_ms != null)
    .reduce((acc, h, _, arr) => acc + (h.latency_ms ?? 0) / arr.length, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Histórico de saúde — {trunkName ?? 'Trunk'}
          </SheetTitle>
          <SheetDescription>Últimas 24 horas de verificações</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma verificação registrada nas últimas 24h
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold text-success">{uptime}%</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Latência média</p>
                <p className="text-2xl font-bold">{Math.round(avgLatency)}ms</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Verificações</p>
                <p className="text-2xl font-bold">{history.length}</p>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm font-medium mb-3">Latência (ms)</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                  />
                  <Line type="monotone" dataKey="latency" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium mb-2">Verificações recentes</p>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {[...history].reverse().slice(0, 30).map(h => (
                  <div key={h.id} className="flex items-center justify-between p-2 rounded border bg-card text-sm">
                    <span className="text-muted-foreground">
                      {safeToLocaleString(h.checked_at, 'pt-BR')}
                    </span>
                    <div className="flex items-center gap-2">
                      {h.reachable ? (
                        <Badge variant="default" className="bg-success/10 text-success border-success/20">
                          {h.latency_ms}ms
                        </Badge>
                      ) : (
                        <Badge variant="destructive">{h.error_message ?? 'offline'}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
