import { useEffect, useMemo, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebhookHealthData } from "@/hooks/useWebhookHealthData";
import { aggregateEndpoints, aggregateHeatmap, type SortMode } from "@/lib/webhook-health-utils";
import { KpiCards } from "@/components/admin/webhook-health/KpiCards";
import { EndpointList } from "@/components/admin/webhook-health/EndpointList";
import { EndpointsToolbar } from "@/components/admin/webhook-health/EndpointsToolbar";
import { HealthHeatmap } from "@/components/admin/webhook-health/HealthHeatmap";

const SORT_KEY = "webhook-health:sort-mode";

export default function WebhookHealth() {
  usePageTitle("Saúde de Webhooks");
  const { rows, loading, fetching, lastRefresh, autoRefresh, setAutoRefresh, loadRows } =
    useWebhookHealthData();

  const [endpointFilter, setEndpointFilter] = useState<string | "all">(() => {
    if (typeof window === "undefined") return "all";
    const p = new URLSearchParams(window.location.search).get("endpoint");
    return p && p.length > 0 ? p : "all";
  });
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    if (typeof window === "undefined") return "volume";
    const q = new URLSearchParams(window.location.search).get("sort");
    if (q === "trend" || q === "ratio" || q === "volume") return q;
    const v = window.localStorage.getItem(SORT_KEY);
    return v === "trend" || v === "ratio" || v === "volume" ? v : "volume";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SORT_KEY, sortMode);
    } catch {
      /* ignore */
    }
  }, [sortMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (endpointFilter === "all") url.searchParams.delete("endpoint");
    else url.searchParams.set("endpoint", endpointFilter);
    if (sortMode === "volume") url.searchParams.delete("sort");
    else url.searchParams.set("sort", sortMode);
    window.history.replaceState({}, "", url.toString());
  }, [endpointFilter, sortMode]);

  // Atalhos: R = refresh, A = auto, Esc = limpar filtro
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        void loadRows();
      } else if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        setAutoRefresh((v) => !v);
      } else if (e.key === "Escape" && endpointFilter !== "all") {
        e.preventDefault();
        setEndpointFilter("all");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loadRows, endpointFilter, setAutoRefresh]);

  const filteredRows = useMemo(
    () =>
      endpointFilter === "all"
        ? rows
        : rows.filter((r) => (r.endpoint_hash ?? "—") === endpointFilter),
    [rows, endpointFilter],
  );

  const endpoints = useMemo(() => aggregateEndpoints(rows, sortMode), [rows, sortMode]);
  const { buckets, days, totals } = useMemo(() => aggregateHeatmap(filteredRows), [filteredRows]);

  const totalAttempts = totals.sent + totals.failed;
  const globalRatio = totalAttempts > 0 ? (totals.failed / totalAttempts) * 100 : 0;

  const handleReset = () => {
    setEndpointFilter("all");
    setSortMode("volume");
    try {
      window.localStorage.removeItem(SORT_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Saúde de Webhooks</h1>
        <p className="text-muted-foreground">
          Heatmap de tentativas e falhas nas últimas 72h (agregado por hora UTC).
        </p>
      </header>

      <KpiCards
        totalAttempts={totalAttempts}
        sent={totals.sent}
        failed={totals.failed}
        globalRatio={globalRatio}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            Endpoints (drill-down)
            <span
              className="hidden md:inline text-[10px] font-normal text-muted-foreground border rounded px-1.5 py-0.5"
              title="Atalhos: R = atualizar, A = alternar auto-refresh, Esc = limpar filtro"
            >
              <kbd className="font-mono">R</kbd> atualizar · <kbd className="font-mono">A</kbd> auto · <kbd className="font-mono">Esc</kbd> limpar
            </span>
          </CardTitle>
          <EndpointsToolbar
            autoRefresh={autoRefresh}
            fetching={fetching}
            lastRefresh={lastRefresh}
            onToggleAuto={() => setAutoRefresh((v) => !v)}
            onRefresh={() => void loadRows()}
            sortMode={sortMode}
            onSortChange={setSortMode}
            endpoints={endpoints}
            endpointFilter={endpointFilter}
            onClearFilter={() => setEndpointFilter("all")}
            onReset={handleReset}
          />
        </CardHeader>
        <CardContent>
          <EndpointList
            endpoints={endpoints}
            totalRows={rows.length}
            endpointFilter={endpointFilter}
            onSelect={setEndpointFilter}
          />
        </CardContent>
      </Card>

      <HealthHeatmap
        loading={loading}
        days={days}
        buckets={buckets}
        endpointFilter={endpointFilter}
      />
    </div>
  );
}
