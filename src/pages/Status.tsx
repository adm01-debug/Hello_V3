import { useEffect, useState } from "react";
import { MarketingLayout } from "./marketing/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertTriangle, XCircle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailySample {
  day: string;
  ok: number;
  total: number;
}

interface ServiceStatus {
  label: string;
  description: string;
  uptime: number;
  samples: DailySample[];
  incidents: number;
}

const DAYS = 90;

function groupByDay(rows: { at: string; healthy: boolean }[]): DailySample[] {
  const map = new Map<string, DailySample>();
  const now = new Date();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { day: key, ok: 0, total: 0 });
  }
  for (const row of rows) {
    const key = row.at.slice(0, 10);
    const bucket = map.get(key);
    if (!bucket) continue;
    bucket.total += 1;
    if (row.healthy) bucket.ok += 1;
  }
  return Array.from(map.values());
}

function computeUptime(samples: DailySample[]): number {
  let ok = 0;
  let total = 0;
  for (const s of samples) {
    ok += s.ok;
    total += s.total;
  }
  if (!total) return 100;
  return Math.round((ok / total) * 10000) / 100;
}

function statusColor(sample: DailySample): string {
  if (sample.total === 0) return "bg-muted";
  const ratio = sample.ok / sample.total;
  if (ratio >= 0.99) return "bg-success";
  if (ratio >= 0.95) return "bg-warning";
  return "bg-destructive";
}

export default function Status() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const load = async () => {
      const since = new Date();
      since.setDate(since.getDate() - DAYS);
      const sinceIso = since.toISOString();

      const [trunkRes, webhookRes] = await Promise.all([
        supabase
          .from("voip_trunk_health_checks")
          .select("checked_at, reachable")
          .gte("checked_at", sinceIso)
          .limit(20000),
        supabase
          .from("webhook_flush_metrics")
          .select("created_at, sent, failed")
          .gte("created_at", sinceIso)
          .limit(20000),
      ]);

      const trunkRows = (trunkRes.data ?? []).map((r) => ({
        at: (r.checked_at as string) ?? new Date().toISOString(),
        healthy: Boolean(r.reachable),
      }));
      const trunkSamples = groupByDay(trunkRows);

      const webhookRows: { at: string; healthy: boolean }[] = [];
      for (const r of webhookRes.data ?? []) {
        const at = (r.created_at as string) ?? new Date().toISOString();
        const ok = Number(r.sent ?? 0);
        const err = Number(r.failed ?? 0);
        for (let i = 0; i < ok; i++) webhookRows.push({ at, healthy: true });
        for (let i = 0; i < err; i++) webhookRows.push({ at, healthy: false });
      }
      const webhookSamples = groupByDay(webhookRows);

      const trunkUptime = computeUptime(trunkSamples);
      const webhookUptime = computeUptime(webhookSamples);

      setServices([
        {
          label: "Trunks VoIP",
          description: "Registro SIP e chamadas em tempo real",
          uptime: trunkUptime,
          samples: trunkSamples,
          incidents: trunkSamples.filter((s) => s.total > 0 && s.ok / s.total < 0.99).length,
        },
        {
          label: "Webhooks & Integrações",
          description: "Bitrix24, WhatsApp e integrações externas",
          uptime: webhookUptime,
          samples: webhookSamples,
          incidents: webhookSamples.filter((s) => s.total > 0 && s.ok / s.total < 0.99).length,
        },
      ]);
      setLastUpdate(new Date());
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const overallOk = services.every((s) => s.uptime >= 99);
  const overallWarn = services.some((s) => s.uptime >= 95 && s.uptime < 99);

  return (
    <MarketingLayout
      title="Status do sistema — CallCenter Pro"
      description="Uptime em tempo real de trunks VoIP, webhooks e integrações nos últimos 90 dias."
    >
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <div className="mb-4 flex justify-center">
              {loading ? (
                <Badge variant="secondary" className="gap-2">
                  <Activity className="h-4 w-4 animate-pulse" /> Carregando métricas…
                </Badge>
              ) : overallOk ? (
                <Badge className="gap-2 bg-success text-success-foreground">
                  <CheckCircle2 className="h-4 w-4" /> Todos os sistemas operacionais
                </Badge>
              ) : overallWarn ? (
                <Badge variant="secondary" className="gap-2 border-warning/40 bg-warning/10 text-warning">
                  <AlertTriangle className="h-4 w-4" /> Desempenho degradado
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-2">
                  <XCircle className="h-4 w-4" /> Incidente em andamento
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Status do sistema</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Uptime consolidado dos últimos {DAYS} dias · atualizado{" "}
              {lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <div className="space-y-6">
            {services.map((svc) => (
              <Card key={svc.label} className="border-border/60">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">{svc.label}</CardTitle>
                    <p className="text-xs text-muted-foreground">{svc.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{svc.uptime.toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground">
                      {svc.incidents === 0
                        ? "sem incidentes"
                        : `${svc.incidents} dia(s) com incidente`}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-[2px] overflow-hidden rounded">
                    {svc.samples.map((s) => (
                      <div
                        key={s.day}
                        title={`${s.day}: ${s.total === 0 ? "sem dados" : `${s.ok}/${s.total} ok`}`}
                        className={cn("h-8 flex-1 min-w-[3px]", statusColor(s))}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>{DAYS} dias atrás</span>
                    <span>Hoje</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            SLA contratual: 99,9% mensal. Métricas alimentadas diretamente pelos health checks internos —
            sem edição manual.
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
