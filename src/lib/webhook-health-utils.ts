export const SPARK_HOURS = 24;
export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const AUTO_REFRESH_MS = 30_000;

export interface WebhookHealthRow {
  created_at: string;
  sent: number;
  failed: number;
  oldest_age_ms: number | null;
  duration_ms: number | null;
  endpoint_hash: string | null;
}

export interface HeatmapBucket {
  day: string;
  hour: number;
  sent: number;
  failed: number;
  attempts: number;
  failureRatio: number;
}

export interface EndpointStat {
  hash: string;
  attempts: number;
  failed: number;
  trend: number[];
  trendDiff: number;
  ratio: number;
}

export type SortMode = "volume" | "trend" | "ratio";

export function ratioColor(ratio: number, attempts: number): string {
  if (attempts === 0) return "bg-muted/30";
  if (ratio >= 0.5) return "bg-destructive/90";
  if (ratio >= 0.2) return "bg-destructive/60";
  if (ratio >= 0.05) return "bg-warning/60";
  return "bg-success/60";
}

export function aggregateEndpoints(
  rows: WebhookHealthRow[],
  sortMode: SortMode,
): EndpointStat[] {
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
    .map(([hash, s]) => {
      const trend = s.hourly.map((h) => {
        const a = h.sent + h.failed;
        return a > 0 ? h.failed / a : 0;
      });
      const lastHour = trend[trend.length - 1] ?? 0;
      const priorAvg =
        trend.length > 1
          ? trend.slice(0, -1).reduce((sum, v) => sum + v, 0) / (trend.length - 1)
          : 0;
      const ratio = s.attempts > 0 ? s.failed / s.attempts : 0;
      return {
        hash,
        attempts: s.attempts,
        failed: s.failed,
        trend,
        trendDiff: lastHour - priorAvg,
        ratio,
      };
    })
    .sort((a, b) => {
      if (sortMode === "trend") return b.trendDiff - a.trendDiff;
      if (sortMode === "ratio") return b.ratio - a.ratio;
      return b.attempts - a.attempts;
    });
}

export function aggregateHeatmap(rows: WebhookHealthRow[]): {
  buckets: Map<string, HeatmapBucket>;
  days: string[];
  totals: { sent: number; failed: number };
} {
  const map = new Map<string, HeatmapBucket>();
  for (const r of rows) {
    const d = new Date(r.created_at);
    if (Number.isNaN(d.getTime())) continue;
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
  const totals = rows.reduce(
    (acc, r) => {
      acc.sent += r.sent ?? 0;
      acc.failed += r.failed ?? 0;
      return acc;
    },
    { sent: 0, failed: 0 },
  );
  return { buckets: map, days: Array.from(daySet), totals };
}

export function endpointsToCsv(endpoints: EndpointStat[]): string {
  const header = "endpoint_hash,attempts,failed,failure_ratio_pct\n";
  const body = endpoints
    .map((e) => {
      const ratio = e.attempts > 0 ? (e.failed / e.attempts) * 100 : 0;
      return `${e.hash},${e.attempts},${e.failed},${ratio.toFixed(2)}`;
    })
    .join("\n");
  return header + body;
}
