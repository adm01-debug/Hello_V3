import { Phone, Pause, Clock, PhoneOff, TrendingUp, TrendingDown, Gauge, CheckCircle, Users, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { QueueMetrics } from '@/hooks/useQueueMetrics';

interface Props {
  metrics: QueueMetrics;
  formatTime: (seconds: number) => string;
}

export function QueueMetricsCards({ metrics, formatTime }: Props) {
  const getServiceLevelColor = (level: number) => {
    if (level >= 80) return 'text-success';
    if (level >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getAbandonmentColor = (rate: number) => {
    if (rate <= 5) return 'text-success';
    if (rate <= 10) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chamadas Ativas</p>
                <p className="text-4xl font-bold text-primary">{metrics.activeCalls}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/20"><Phone className="h-8 w-8 text-primary" /></div>
            </div>
            {metrics.waitingCalls > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="outline" className="border-warning text-warning">
                  <Pause className="h-3 w-3 mr-1" />{metrics.waitingCalls} em espera
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nível de Serviço</p>
                <p className={`text-4xl font-bold ${getServiceLevelColor(metrics.serviceLevel)}`}>{metrics.serviceLevel}%</p>
              </div>
              <div className={`p-3 rounded-full ${metrics.serviceLevel >= 80 ? 'bg-success/20' : 'bg-warning/20'}`}>
                <Gauge className={`h-8 w-8 ${getServiceLevelColor(metrics.serviceLevel)}`} />
              </div>
            </div>
            <Progress value={metrics.serviceLevel} className="mt-4" />
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Abandono</p>
                <p className={`text-4xl font-bold ${getAbandonmentColor(metrics.abandonmentRate)}`}>{metrics.abandonmentRate}%</p>
              </div>
              <div className={`p-3 rounded-full ${metrics.abandonmentRate <= 5 ? 'bg-success/20' : 'bg-destructive/20'}`}>
                <PhoneOff className={`h-8 w-8 ${getAbandonmentColor(metrics.abandonmentRate)}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              {metrics.abandonmentRate <= 5 ? (
                <><TrendingDown className="h-4 w-4 text-success" />Dentro da meta</>
              ) : (
                <><TrendingUp className="h-4 w-4 text-destructive" />Acima da meta</>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio de Espera</p>
                <p className="text-4xl font-bold">{formatTime(metrics.avgWaitTime)}</p>
              </div>
              <div className="p-3 rounded-full bg-accent/20"><Clock className="h-8 w-8 text-accent-foreground" /></div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">TMA: {formatTime(metrics.avgHandleTime)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Status */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Status dos Agentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-success" />
                <div><p className="font-medium">Disponíveis</p><p className="text-sm text-muted-foreground">Prontos para atender</p></div>
              </div>
              <span className="text-3xl font-bold text-success">{metrics.agentsAvailable}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-3">
                <Phone className="h-6 w-6 text-primary" />
                <div><p className="font-medium">Em Atendimento</p><p className="text-sm text-muted-foreground">Em chamada ativa</p></div>
              </div>
              <span className="text-3xl font-bold text-primary">{metrics.agentsBusy}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-center gap-3">
                <Pause className="h-6 w-6 text-warning" />
                <div><p className="font-medium">Em Pausa</p><p className="text-sm text-muted-foreground">Intervalos e reuniões</p></div>
              </div>
              <span className="text-3xl font-bold text-warning">{metrics.agentsOnBreak}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
