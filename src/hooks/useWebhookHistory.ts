import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  loadWebhookHistory,
  appendWebhookHistory,
  clearWebhookHistory,
  downloadWebhookHistoryCSV,
  downloadWebhookHistoryNDJSON,
  type WebhookHistoryEntry,
} from "@/lib/security-alerts-webhook-history";

/**
 * Hook: encapsula o histórico persistente de envios de webhook (CRUD local
 * em localStorage), oferecendo ações reativas de append, clear e export
 * (CSV/NDJSON), além de um sinal externo (`refreshKey`) para recarregar após
 * eventos de flush disparados por outros hooks (ex.: useWebhookQueue).
 */
export function useWebhookHistory(refreshKey: number = 0) {
  const [history, setHistory] = useState<WebhookHistoryEntry[]>(() => loadWebhookHistory());

  useEffect(() => {
    if (refreshKey > 0) setHistory(loadWebhookHistory());
  }, [refreshKey]);

  const record = useCallback((entry: Omit<WebhookHistoryEntry, "id" | "at">) => {
    appendWebhookHistory(entry);
    setHistory(loadWebhookHistory());
  }, []);

  const clear = useCallback(() => {
    clearWebhookHistory();
    setHistory([]);
    toast.success("Histórico limpo");
  }, []);

  const exportCsv = useCallback(() => {
    if (history.length === 0) {
      toast.error("Sem histórico para exportar");
      return;
    }
    const filename = downloadWebhookHistoryCSV(history);
    toast.success(`Histórico exportado (${history.length}) — ${filename}`);
  }, [history]);

  const exportNdjson = useCallback(() => {
    if (history.length === 0) {
      toast.error("Sem histórico para exportar");
      return;
    }
    const filename = downloadWebhookHistoryNDJSON(history);
    toast.success(`Histórico NDJSON exportado (${history.length}) — ${filename}`);
  }, [history]);

  return { history, record, clear, exportCsv, exportNdjson };
}

