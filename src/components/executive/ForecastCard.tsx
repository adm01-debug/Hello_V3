import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, Target, Activity } from "lucide-react";
import { useDealForecast } from "@/hooks/useDealForecast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function fmt(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
    .format(cents / 100);
}

export function ForecastCard() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");
  const { data, loading } = useDealForecast(period);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-primary/30 shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Previsão de receita
          </CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as "week" | "month" | "quarter")}>
            <TabsList>
              <TabsTrigger value="week">7d</TabsTrigger>
              <TabsTrigger value="month">30d</TabsTrigger>
              <TabsTrigger value="quarter">90d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {loading || !mounted ? (
          <p className="text-muted-foreground">Calculando...</p>
        ) : !data || data.total_deals === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma oportunidade aberta no período.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <Stat icon={DollarSign} label="Forecast ponderado" value={fmt(data.weighted_forecast_cents)} accent="primary" />
            <Stat icon={Target} label="Commit" value={fmt(data.commit_cents)} accent="emerald" />
            <Stat icon={TrendingUp} label="Best case" value={fmt(data.best_case_cents)} accent="cyan" />
            <Stat icon={Activity} label="Confiança" value={`${data.confidence}%`}
                  accent={data.confidence >= 70 ? "emerald" : data.confidence >= 50 ? "amber" : "red"} />
          </div>
        )}
        {data && data.total_deals > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline">{data.total_deals} oportunidades</Badge>
            <Badge variant="outline">Pipeline {fmt(data.total_pipeline_cents)}</Badge>
            <Badge variant="outline">Horizonte {data.horizon}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: typeof DollarSign; label: string; value: string; accent: string }) {
  const colorMap: Record<string, string> = {
    primary: "text-primary", emerald: "text-emerald-400", cyan: "text-cyan-400",
    amber: "text-amber-400", red: "text-red-400",
  };
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`h-3 w-3 ${colorMap[accent] ?? "text-primary"}`} />{label}
      </div>
      <p className={`text-xl font-bold ${colorMap[accent] ?? "text-primary"}`}>{value}</p>
    </div>
  );
}
