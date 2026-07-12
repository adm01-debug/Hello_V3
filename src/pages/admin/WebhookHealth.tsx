import { useEffect, useMemo, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { EndpointSparkline } from "@/components/admin/EndpointSparkline";

const SPARK_HOURS = 24;

interface Row {
  created_at: string;
  sent: number;
  failed: number;
  oldest_age_ms: number | null;
  duration_ms: number | null;
  endpoint_hash: string | null;
}

interface Bucket {
  day: string; // YYYY-MM-DD
  hour: number;
  sent: number;
  failed: number;
  attempts: number;
  failureRatio: number;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function ratioColor(ratio: number, attempts: number): string {
  if (attempts === 0) return "bg-muted/30";
  if (ratio >= 0.5) return "bg-destructive/90";
  if (ratio >= 0.2) return "bg-destructive/60";
  if (ratio >= 0.05) return "bg-warning/60";
  return "bg-success/60";
}

export default function WebhookHealth() {
  usePageTitle("Saúde de Webhooks");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [endpointFilter, setEndpointFilter] = useState<string | "all">("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("webhook_flush_metrics")
        .select("created_at,sent,failed,oldest_age_ms,duration_ms,endpoint_hash")
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .limit(10000);
      if (cancelled) return;
      if (error) {
        logger.error("webhook_health_load_failed", { error: error.message });
      } else {
        setRows((data ?? []) as Row[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);


  const filteredRows = useMemo(
    () =>
      endpointFilter === "all"
        ? rows
        : rows.filter((r) => (r.endpoint_hash ?? "—") === endpointFilter),
    [rows, endpointFilter],
  );

  const endpoints = useMemo(() => {
    const nowHour = Math.floor(Date.now() / 3_600_000);
    const map = new Map<
      string,
      { attempts: number; failed: number; hourly: { sent: number; failed: number }[] }
    >();
    for (const r of rows) {
      const key = r.endpoint_hash ?? "—";
      const cur =
        map.get(key) ??
        {
          attempts: 0,
          failed: 0,
          hourly: Array.from({ length: SPARK_HOURS }, () => ({ sent: 0, failed: 0 })),
        };
      const sent = r.sent ?? 0;
      const failed = r.failed ?? 0;
      cur.attempts += sent + failed;
      cur.failed += failed;
      const rowHour = Math.floor(new Date(r.created_at).getTime() / 3_600_000);
      const idx = SPARK_HOURS - 1 - (nowHour - rowHour);
      if (idx >= 0 && idx < SPARK_HOURS) {
        cur.hourly[idx].sent += sent;
        cur.hourly[idx].failed += failed;
      }
      map.set(key, cur);
    }
    return Array.from(map.entries())
      .map(([hash, s]) => ({
        hash,
        attempts: s.attempts,
        failed: s.failed,
        trend: s.hourly.map((h) => {
          const a = h.sent + h.failed;
          return a > 0 ? h.failed / a : 0;
        }),
      }))
      .sort((a, b) => b.attempts - a.attempts);
  }, [rows]);

  const { buckets, days, totals } = useMemo(() => {
    const map = new Map<string, Bucket>();
    for (const r of filteredRows) {
      const d = new Date(r.created_at);
      const day = d.toISOString().slice(0, 10);
      const hour = d.getUTCHours();
      const key = `${day}#${hour}`;
      const b = map.get(key) ?? {
        day,
        hour,
        sent: 0,
        failed: 0,
        attempts: 0,
        failureRatio: 0,
      };
      b.sent += r.sent ?? 0;
      b.failed += r.failed ?? 0;
      b.attempts = b.sent + b.failed;
      b.failureRatio = b.attempts > 0 ? b.failed / b.attempts : 0;
      map.set(key, b);
    }
    const daySet = new Set<string>();
    for (let i = 2; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      daySet.add(d.toISOString().slice(0, 10));
    }
    const daysArr = Array.from(daySet);
    const totals = filteredRows.reduce(
      (acc, r) => {
        acc.sent += r.sent ?? 0;
        acc.failed += r.failed ?? 0;
        return acc;
      },
      { sent: 0, failed: 0 },
    );
    return { buckets: map, days: daysArr, totals };
  }, [filteredRows]);


  const totalAttempts = totals.sent + totals.failed;
  const globalRatio = totalAttempts > 0 ? (totals.failed / totalAttempts) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Saúde de Webhooks</h1>
        <p className="text-muted-foreground">
          Heatmap de tentativas e falhas nas últimas 72h (agregado por hora UTC).
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Tentativas (72h)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totalAttempts}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Enviados / Falhas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {totals.sent} / <span className="text-destructive">{totals.failed}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Taxa de falhas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {globalRatio.toFixed(1)}%
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle>Endpoints (drill-down)</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={endpoints.length === 0}
              onClick={() => {
                const header = "endpoint_hash,attempts,failed,failure_ratio_pct\n";
                const body = endpoints
                  .map((e) => {
                    const ratio = e.attempts > 0 ? (e.failed / e.attempts) * 100 : 0;
                    return `${e.hash},${e.attempts},${e.failed},${ratio.toFixed(2)}`;
                  })
                  .join("\n");
                const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `webhook-endpoints-${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              Exportar CSV
            </Button>
            {endpointFilter !== "all" && (
              <Button size="sm" variant="ghost" onClick={() => setEndpointFilter("all")}>
                Limpar filtro
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {endpoints.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados nas últimas 72h.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={endpointFilter === "all" ? "default" : "outline"}
                onClick={() => setEndpointFilter("all")}
              >
                Todos ({rows.length})
              </Button>
              {endpoints.map((e) => {
                const ratio = e.attempts > 0 ? (e.failed / e.attempts) * 100 : 0;
                const active = endpointFilter === e.hash;
                return (
                  <Button
                    key={e.hash}
                    size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={() => setEndpointFilter(e.hash)}
                    className="h-auto gap-2 px-2 py-1 font-mono text-xs"
                    title={`${e.attempts} tentativas · ${e.failed} falhas · ${ratio.toFixed(1)}% · tendência ${SPARK_HOURS}h`}
                  >
                    <span>
                      {e.hash} · {e.attempts}
                    </span>
                    <EndpointSparkline points={e.trend} />
                    {ratio >= 20 && (
                      <span className="text-destructive">⚠ {ratio.toFixed(0)}%</span>
                    )}
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
