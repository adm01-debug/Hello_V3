import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HOURS, ratioColor, type HeatmapBucket } from "@/lib/webhook-health-utils";

interface Props {
  loading: boolean;
  days: string[];
  buckets: Map<string, HeatmapBucket>;
  endpointFilter: string | "all";
}

export function HealthHeatmap({ loading, days, buckets, endpointFilter }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Heatmap · 3 dias × 24 horas
          {endpointFilter !== "all" && (
            <span className="ml-2 font-mono text-xs text-muted-foreground">
              endpoint {endpointFilter}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="p-1 text-left text-muted-foreground">Dia (UTC)</th>
                  {HOURS.map((h) => (
                    <th key={h} className="p-1 text-center text-muted-foreground w-8">
                      {h.toString().padStart(2, "0")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day}>
                    <td className="p-1 pr-2 font-mono">{day.slice(5)}</td>
                    {HOURS.map((h) => {
                      const b = buckets.get(`${day}#${h}`);
                      const attempts = b?.attempts ?? 0;
                      const ratio = b?.failureRatio ?? 0;
                      const title = attempts
                        ? `${day} ${h}:00 UTC · ${b?.sent}✓ / ${b?.failed}✗ (${(ratio * 100).toFixed(0)}%)`
                        : `${day} ${h}:00 UTC · sem dados`;
                      return (
                        <td key={h} className="p-0.5">
                          <div
                            title={title}
                            className={`h-6 w-8 rounded-sm ${ratioColor(ratio, attempts)}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>Legenda:</span>
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-sm bg-muted/30" /> sem dados
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-sm bg-success/60" /> &lt;5%
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-sm bg-warning/60" /> 5–20%
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-sm bg-destructive/60" /> 20–50%
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-sm bg-destructive/90" /> ≥50%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
