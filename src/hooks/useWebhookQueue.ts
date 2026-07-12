import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  installWebhookQueueAutoFlush,
  loadWebhookQueue,
  subscribeWebhookQueue,
  flushWebhookQueue,
  clearWebhookQueue,
} from "@/lib/security-alerts-webhook-queue";

/**
 * Hook: encapsula estado da fila persistente de webhooks (pendentes),
 * auto-flush, subscription reativa, tick de 30s para "idade do mais antigo"
 * e ações de flush/limpeza. Retorna também um sinal (`flushedAt`) útil para
 * consumidores recarregarem o histórico após um flush bem sucedido.
 */
export function useWebhookQueue() {
  const [queue, setQueue] = useState(() => loadWebhookQueue());
  const [isFlushing, setIsFlushing] = useState(false);
  const [flushedAt, setFlushedAt] = useState<number>(0);

  useEffect(() => {
    installWebhookQueueAutoFlush();
    const unsub = subscribeWebhookQueue((q) => setQueue([...q]));
    const tick = setInterval(
      () => setQueue((prev) => (prev.length ? [...prev] : prev)),
      30_000,
    );
    return () => {
      unsub();
      clearInterval(tick);
    };
  }, []);

  const pendingCount = queue.length;
  const oldestAgeMs = queue.length
    ? Date.now() - Math.min(...queue.map((q) => new Date(q.enqueuedAt).getTime()))
    : 0;

  const flush = useCallback(async () => {
    if (isFlushing) return;
    setIsFlushing(true);
    const t = toast.loading("Reenviando webhooks pendentes…");
    try {
      const res = await flushWebhookQueue();
      setFlushedAt(Date.now());
      toast.dismiss(t);
      if (res.sent > 0 && res.failed === 0) {
        toast.success(`Fila esvaziada — ${res.sent} envio(s) OK`);
      } else if (res.sent === 0 && res.failed === 0) {
        toast.info("Nada na fila para reenviar");
      } else {
        toast.warning(
          `Reenviados: ${res.sent} · Falharam: ${res.failed} · Restantes: ${res.remaining}`,
        );
      }
    } finally {
      setIsFlushing(false);
    }
  }, [isFlushing]);

  const clear = useCallback(() => {
    clearWebhookQueue();
    toast.success("Fila de webhooks limpa");
  }, []);

  return {
    queue,
    pendingCount,
    oldestAgeMs,
    isFlushing,
    flushedAt,
    flush,
    clear,
  };
}
