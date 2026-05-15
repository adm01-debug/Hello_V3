import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { Activity, PhoneCall, Zap, AlertTriangle, CheckCircle } from "lucide-react";

export const QualityTrunkDashboard = () => {
  const { data: qualityMetrics, isLoading: loadingQuality } = useQuery({
    queryKey: ['call-quality-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('call_quality_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000 // Real-timeish
  });

  const { data: trunkUsage, isLoading: loadingTrunks } = useQuery({
    queryKey: ['trunk-usage-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voip_trunk_usage_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000
  });

  if (loadingQuality || loadingTrunks) return <div>Carregando métricas...</div>;

  const avgMos = (qualityMetrics && qualityMetrics.length > 0) ? qualityMetrics.reduce((acc, m) => acc + Number(m.mos_avg), 0) / qualityMetrics.length : 0;
  const avgJitter = (qualityMetrics && qualityMetrics.length > 0) ? qualityMetrics.reduce((acc, m) => acc + Number(m.jitter_avg_ms), 0) / qualityMetrics.length : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">MOS Médio (Qualidade)</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMos.toFixed(2)}</div>
            <Progress value={(avgMos / 5) * 100} className="mt-2 h-1" />
            <p className="text-xs text-muted-foreground mt-1">
              {avgMos > 4 ? "Excelente" : avgMos > 3 ? "Bom" : "Pobre"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jitter Médio</CardTitle>
            <Zap className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgJitter.toFixed(1)}ms</div>
            <p className="text-xs text-muted-foreground mt-1">Estabilidade de rede</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Troncos Ativos</CardTitle>
            <PhoneCall className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trunkUsage?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Canais SIP em uso</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Qualidade de Voz (MOS) - Tempo Real</CardTitle>
            <CardDescription>Média das últimas 50 amostras</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={qualityMetrics?.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="created_at" hide />
                  <YAxis domain={[0, 5]} />
                  <Tooltip labelFormatter={(val) => new Date(val).toLocaleTimeString()} />
                  <Area type="monotone" dataKey="mos_avg" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uso de Troncos (Canais)</CardTitle>
            <CardDescription>Capacidade simultânea por tronco</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trunkUsage}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="trunk_id" className="text-xs" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="active_calls" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
