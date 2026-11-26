import { useState } from "react";
import { Activity, DollarSign, Minus, Target, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  pipelineTrendBarHeight,
  pipelineTrendDeltaPercent,
  pipelineTrendDeltaTone,
  useDealPipelineTrend,
  type PipelineTrendPeriod,
} from "@/hooks/useDealPipelineTrend";

function shortDate(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function pipelineDeltaBadge(delta: number) {
  const tone = pipelineTrendDeltaTone(delta);
  const Icon = tone === "up" ? TrendingUp : tone === "down" ? TrendingDown : Minus;
  const className =
    tone === "up" ? "text-green-600" : tone === "down" ? "text-red-600" : "text-muted-foreground";
  return (
    <span className={`flex items-center gap-1 text-sm font-medium ${className}`}>
      <Icon className="h-4 w-4" />
      {delta > 0 ? "+" : ""}
      {delta.toLocaleString("pt-BR")}%
    </span>
  );
}

export function DealPipelineTrendCard() {
  const [period, setPeriod] = useState<PipelineTrendPeriod>(30);
  const { data, isLoading, isError, refetch } = useDealPipelineTrend(period);

  const series = data ?? [];
  const latest = series.length > 0 ? series[series.length - 1] : null;
  const first = series.length > 0 ? series[0] : null;
  const maxValue = series.reduce((acc, row) => Math.max(acc, row.total_value_cents), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Pipeline ao longo do tempo
          </CardTitle>
          <Tabs value={String(period)} onValueChange={(value) => setPeriod(Number(value) as PipelineTrendPeriod)}>
            <TabsList>
              <TabsTrigger value="7">7d</TabsTrigger>
              <TabsTrigger value="30">30d</TabsTrigger>
              <TabsTrigger value="90">90d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Carregando histórico...</p>
        ) : isError ? (
          <div className="space-y-2">
            <p className="text-destructive text-sm">Não foi possível carregar o histórico do pipeline.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar de novo
            </Button>
          </div>
        ) : !latest ? (
          <p className="text-muted-foreground text-sm">
            Ainda não há retrato diário do pipeline neste período. O sistema grava um retrato por dia,
            automaticamente, à meia-noite.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Pipeline aberto hoje</p>
                <p className="text-xl font-semibold flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-primary" />
                  {formatCurrency(latest.total_value_cents / 100)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Variação no período</p>
                {first && first.snapshot_date !== latest.snapshot_date ? (
                  pipelineDeltaBadge(pipelineTrendDeltaPercent(latest.total_value_cents, first.total_value_cents))
                ) : (
                  <p className="text-sm text-muted-foreground">Primeiro retrato do período</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Oportunidades abertas</p>
                <p className="text-xl font-semibold flex items-center gap-1">
                  <Target className="h-4 w-4 text-primary" />
                  {latest.open_count.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Previsão ponderada de hoje: {formatCurrency(latest.weighted_value_cents / 100)}
              </p>
              <div className="flex items-end gap-1 h-24" role="img" aria-label="Evolução do valor do pipeline aberto por dia">
                {series.map((row) => (
                  <div
                    key={row.snapshot_date}
                    className="flex-1 rounded-t bg-primary/70 hover:bg-primary transition-colors"
                    style={{ height: `${pipelineTrendBarHeight(row.total_value_cents, maxValue)}%` }}
                    title={`${shortDate(row.snapshot_date)}: ${formatCurrency(row.total_value_cents / 100)} em ${row.open_count} oportunidade(s)`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                <span>{shortDate(series[0].snapshot_date)}</span>
                <span>{shortDate(latest.snapshot_date)}</span>
              </div>
            </div>
          </>
        )}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            Retrato diário automático · visível só para administradores e supervisores
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Atualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}