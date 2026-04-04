import {
  Phone, Users, Star, Activity, Clock, CheckCircle2, AlertTriangle, Target,
  Pause, Timer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendIndicator } from './TrendIndicator';
import { type DashboardMetrics, type PeriodType, formatDuration, getPeriodLabel } from '@/hooks/useExecutiveDashboard';

interface KPICardsProps {
  metrics: DashboardMetrics;
  period: PeriodType;
}

export function KPICardsRow1({ metrics, period }: KPICardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Chamadas</CardTitle>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.totalCalls}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">
              {period === 'all' ? 'período total' : `vs ${getPeriodLabel(period)}`}
            </span>
            <TrendIndicator value={metrics.callsTrend} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.totalAgents}</div>
          <p className="text-xs text-muted-foreground mt-1">Atendendo chamadas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Satisfação Média</CardTitle>
          <Star className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.avgSatisfaction.toFixed(1)}/10</div>
          <Progress value={metrics.avgSatisfaction * 10} className="h-2 mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance Média</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.avgPerformance.toFixed(1)}/10</div>
          <Progress value={metrics.avgPerformance * 10} className="h-2 mt-2" />
        </CardContent>
      </Card>
    </div>
  );
}

export function KPICardsRow2({ metrics }: KPICardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatDuration(metrics.avgDuration)}</div>
          <p className="text-xs text-muted-foreground mt-1">Por chamada</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-500">{metrics.completionRate.toFixed(1)}%</div>
          <Progress value={metrics.completionRate} className="h-2 mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertas Pendentes</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.alertsCount}</div>
          <div className="flex items-center gap-2 mt-1">
            {metrics.criticalAlerts > 0 && (
              <Badge variant="destructive" className="text-xs">{metrics.criticalAlerts} críticos</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meta Geral</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {metrics.avgSatisfaction >= 8 && metrics.avgPerformance >= 8 ? (
              <span className="text-success">Atingida</span>
            ) : (
              <span className="text-warning">Em progresso</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Satisfação &amp; Performance ≥ 8</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function HoldKPICards({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-call-hold/30 bg-call-hold/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Total em Espera</CardTitle>
          <Pause className="h-4 w-4 text-call-hold" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-call-hold">{formatDuration(metrics.totalHoldTime)}</div>
          <p className="text-xs text-muted-foreground mt-1">{metrics.holdCount} eventos de hold</p>
        </CardContent>
      </Card>

      <Card className="border-call-hold/30 bg-call-hold/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Média por Hold</CardTitle>
          <Timer className="h-4 w-4 text-call-hold" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatDuration(metrics.avgHoldTime)}</div>
          <Progress
            value={Math.min((metrics.avgHoldTime / 120) * 100, 100)}
            className={`h-2 mt-2 ${metrics.avgHoldTime > 60 ? '[&>div]:bg-destructive' : metrics.avgHoldTime > 30 ? '[&>div]:bg-warning' : '[&>div]:bg-success'}`}
          />
        </CardContent>
      </Card>

      <Card className="border-call-hold/30 bg-call-hold/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Hold</CardTitle>
          <Clock className="h-4 w-4 text-call-hold" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.holdRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground mt-1">Chamadas com espera</p>
        </CardContent>
      </Card>

      <Card className="border-call-hold/30 bg-call-hold/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertas de Espera</CardTitle>
          <AlertTriangle className="h-4 w-4 text-call-hold" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.holdAlerts}</div>
          <p className="text-xs text-muted-foreground mt-1">Pendentes</p>
        </CardContent>
      </Card>
    </div>
  );
}
