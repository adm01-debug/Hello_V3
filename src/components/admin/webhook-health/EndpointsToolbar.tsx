import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { endpointsToCsv, type EndpointStat, type SortMode } from "@/lib/webhook-health-utils";

interface Props {
  autoRefresh: boolean;
  fetching: boolean;
  lastRefresh: Date | null;
  onToggleAuto: () => void;
  onRefresh: () => void;
  sortMode: SortMode;
  onSortChange: (m: SortMode) => void;
  endpoints: EndpointStat[];
  endpointFilter: string | "all";
  onClearFilter: () => void;
  onReset: () => void;
}

export function EndpointsToolbar({
  autoRefresh,
  fetching,
  lastRefresh,
  onToggleAuto,
  onRefresh,
  sortMode,
  onSortChange,
  endpoints,
  endpointFilter,
  onClearFilter,
  onReset,
}: Props) {
  const handleExport = () => {
    const csv = endpointsToCsv(endpoints);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `webhook-endpoints-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      logger.info("webhook_health_link_copied", { endpoint: endpointFilter });
    } catch (err) {
      logger.warn("webhook_health_link_copy_failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        size="sm"
        variant={autoRefresh ? "default" : "outline"}
        className="h-7 px-2 text-xs"
        onClick={onToggleAuto}
        title={autoRefresh ? "Auto-refresh a cada 30s ativo" : "Ativar auto-refresh (30s)"}
      >
        {autoRefresh ? "⏸ Auto 30s" : "▶ Auto 30s"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs"
        onClick={onRefresh}
        title={lastRefresh ? `Última atualização: ${lastRefresh.toLocaleTimeString()}` : "Atualizar agora"}
      >
        <span className={fetching ? "inline-block animate-spin" : "inline-block"}>↻</span>
      </Button>
      <span
        aria-hidden
        className={`inline-block h-2 w-2 rounded-full transition-colors ${
          fetching ? "bg-primary animate-pulse" : "bg-muted-foreground/40"
        }`}
        title={fetching ? "Carregando…" : "Ocioso"}
      />
      <div className="flex items-center gap-1 rounded-md border p-0.5" role="group" aria-label="Ordenação">
        {(["volume", "trend", "ratio"] as SortMode[]).map((m) => (
          <Button
            key={m}
            size="sm"
            variant={sortMode === m ? "default" : "ghost"}
            className="h-7 px-2 text-xs"
            onClick={() => onSortChange(m)}
            title={
              m === "volume"
                ? "Ordenar por volume de tentativas"
                : m === "trend"
                  ? "Ordenar por tendência (última hora vs média)"
                  : "Ordenar por taxa de falhas"
            }
          >
            {m === "volume" ? "Volume" : m === "trend" ? "Tendência" : "Taxa"}
          </Button>
        ))}
      </div>
      <Button size="sm" variant="outline" disabled={endpoints.length === 0} onClick={handleExport}>
        Exportar CSV
      </Button>
      {endpointFilter !== "all" && (
        <>
          <Button size="sm" variant="outline" onClick={handleCopyLink} title="Copiar link do drill-down">
            Copiar link
          </Button>
          <Button size="sm" variant="ghost" onClick={onClearFilter}>
            Limpar filtro
          </Button>
        </>
      )}
      {(endpointFilter !== "all" || sortMode !== "volume") && (
        <Button size="sm" variant="ghost" className="text-xs" onClick={onReset} title="Resetar filtros e ordenação">
          Resetar
        </Button>
      )}
    </div>
  );
}
