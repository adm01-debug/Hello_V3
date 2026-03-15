import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Tag, TrendingUp, TrendingDown, Minus, AlertTriangle, 
  CheckCircle2, BarChart3, MessageSquare, Bell
} from 'lucide-react';

interface TopicTrend {
  id: string;
  topic: string;
  total_occurrences: number;
  avg_sentiment: number | null;
  calls_affected: number;
  trend_direction: string;
  period_start: string;
  period_end: string;
}

interface ManagerAlert {
  id: string;
  call_session_id: string;
  agent_name: string | null;
  alert_type: string;
  severity: string;
  trigger_reason: string;
  sentiment_score: number | null;
  is_resolved: boolean;
  resolved_by: string | null;
  created_at: string;
}

export default function TopicDetection() {
  const queryClient = useQueryClient();

  const { data: trends = [] } = useQuery({
    queryKey: ['topic-trends'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topic_trends')
        .select('*')
        .order('total_occurrences', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as TopicTrend[];
    },
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['manager-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manager_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as ManagerAlert[];
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('manager_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['manager-alerts'] }),
  });

  const unresolvedAlerts = alerts.filter(a => !a.is_resolved);

  const TrendIcon = ({ dir }: { dir: string }) => {
    if (dir === 'up') return <TrendingUp className="h-4 w-4 text-destructive" />;
    if (dir === 'down') return <TrendingDown className="h-4 w-4 text-success" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getSentimentColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 0.6) return 'text-success';
    if (score >= 0.3) return 'text-amber-500';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Tag className="h-8 w-8 text-primary" />
          Detecção de Temas & Recuperação do Gerente
        </h1>
        <p className="text-muted-foreground">Análise automática de temas recorrentes e alertas de sentimento negativo</p>
      </div>

      {/* Manager Recovery Alerts */}
      {unresolvedAlerts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Bell className="h-5 w-5" />
              Alertas de Recuperação ({unresolvedAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unresolvedAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-background border">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`h-5 w-5 ${alert.severity === 'critical' ? 'text-destructive' : 'text-amber-500'}`} />
                  <div>
                    <p className="font-medium text-sm">{alert.trigger_reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Agente: {alert.agent_name || 'N/A'} • 
                      Sentimento: {alert.sentiment_score?.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'outline'}>
                    {alert.severity}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => resolveAlert.mutate(alert.id)}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Resolver
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{trends.length}</p>
              <p className="text-xs text-muted-foreground">Temas Detectados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{trends.filter(t => t.trend_direction === 'up').length}</p>
              <p className="text-xs text-muted-foreground">Em Alta</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unresolvedAlerts.length}</p>
              <p className="text-xs text-muted-foreground">Alertas Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{alerts.filter(a => a.is_resolved).length}</p>
              <p className="text-xs text-muted-foreground">Resolvidos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Topic trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Temas Recorrentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trends.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-medium text-muted-foreground">Nenhum tema detectado ainda</p>
              <p className="text-sm text-muted-foreground/60">Os temas serão identificados automaticamente durante as chamadas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trends.map(trend => (
                <div key={trend.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <TrendIcon dir={trend.trend_direction} />
                    <div>
                      <p className="font-medium">{trend.topic}</p>
                      <p className="text-xs text-muted-foreground">
                        {trend.calls_affected} chamadas afetadas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{trend.total_occurrences}x</p>
                      <p className="text-xs text-muted-foreground">ocorrências</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${getSentimentColor(trend.avg_sentiment)}`}>
                        {trend.avg_sentiment ? `${(trend.avg_sentiment * 100).toFixed(0)}%` : 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">sentimento</p>
                    </div>
                    <Badge variant={
                      trend.trend_direction === 'up' ? 'destructive' : 
                      trend.trend_direction === 'down' ? 'default' : 'outline'
                    }>
                      {trend.trend_direction === 'up' ? '↑ Alta' : trend.trend_direction === 'down' ? '↓ Queda' : '— Estável'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All manager alerts history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Histórico de Alertas do Gerente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum alerta registrado</p>
          ) : (
            <div className="space-y-2">
              {alerts.map(alert => (
                <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg border ${alert.is_resolved ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3">
                    {alert.is_resolved ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{alert.trigger_reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.agent_name || 'N/A'} • {new Date(alert.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={alert.is_resolved ? 'outline' : alert.severity === 'critical' ? 'destructive' : 'default'}>
                    {alert.is_resolved ? 'Resolvido' : alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
