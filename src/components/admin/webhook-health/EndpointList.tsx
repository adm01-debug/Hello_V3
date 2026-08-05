import { Button } from "@/components/ui/button";
import { EndpointSparkline } from "@/components/admin/EndpointSparkline";
import type { EndpointStat } from "@/lib/webhook-health-utils";

interface Props {
  endpoints: EndpointStat[];
  totalRows: number;
  endpointFilter: string | "all";
  onSelect: (hash: string | "all") => void;
}

export function EndpointList({ endpoints, totalRows, endpointFilter, onSelect }: Props) {
  if (endpoints.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados nas últimas 72h.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant={endpointFilter === "all" ? "default" : "outline"}
        onClick={() => onSelect("all")}
      >
        Todos ({totalRows})
      </Button>
      {endpoints.map((e) => {
        const ratio = e.attempts > 0 ? (e.failed / e.attempts) * 100 : 0;
        const active = endpointFilter === e.hash;
        const lastHour = e.trend[e.trend.length - 1] ?? 0;
        const priorAvg =
          e.trend.length > 1
            ? e.trend.slice(0, -1).reduce((s, v) => s + v, 0) / (e.trend.length - 1)
            : 0;
        const diff = lastHour - priorAvg;
        const trendUp = diff > 0.02;
        const trendDown = diff < -0.02;
        const trendLabel = trendUp
          ? `▲ ${(diff * 100).toFixed(0)}pp`
          : trendDown
            ? `▼ ${(Math.abs(diff) * 100).toFixed(0)}pp`
            : "•";
        const trendClass = trendUp
          ? "text-destructive"
          : trendDown
            ? "text-success"
            : "text-muted-foreground";
        return (
          <Button
            key={e.hash}
            size="sm"
            variant={active ? "default" : "outline"}
            onClick={() => onSelect(e.hash)}
            className="h-auto gap-2 px-2 py-1 font-mono text-xs"
            title={`${e.attempts} tentativas · ${e.failed} falhas · ${ratio.toFixed(1)}% · última hora ${(lastHour * 100).toFixed(0)}% vs média ${(priorAvg * 100).toFixed(0)}%`}
          >
            <span>
              {e.hash} · {e.attempts}
            </span>
            <EndpointSparkline points={e.trend} />
            <span className={trendClass}>{trendLabel}</span>
            {ratio >= 20 && <span className="text-destructive">⚠ {ratio.toFixed(0)}%</span>}
          </Button>
        );
      })}
    </div>
  );
}
