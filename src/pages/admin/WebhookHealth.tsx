import { useEffect, useMemo, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/logger";

interface Row {
  created_at: string;
  sent: number;
  failed: number;
  oldest_age_ms: number | null;
  duration_ms: number | null;
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("webhook_flush_metrics")
        .select("created_at,sent,failed,oldest_age_ms,duration_ms")
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

  const { buckets, days, totals } = useMemo(() => {
    const map = new Map<string, Bucket>();
    for (const r of rows) {
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
    const totals = rows.reduce(
      (acc, r) => {
        acc.sent += r.sent ?? 0;
        acc.failed += r.failed ?? 0;
        return acc;
      },
      { sent: 0, failed: 0 },
    );
    return { buckets: map, days: daysArr, totals };
  }, [rows]);

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
        <CardHeader>
          <CardTitle>Heatmap · 3 dias × 24 horas</CardTitle>
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
