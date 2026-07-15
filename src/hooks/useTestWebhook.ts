import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  sendExportWebhook,
  type WebhookExportPayload,
} from "@/lib/security-alerts-webhook";
import type { WebhookHistoryEntry } from "@/lib/security-alerts-webhook-history";

interface WebhookValidation {
  errors: {
    url?: string;
    secret?: string;
    maxAttempts?: string;
    baseDelayMs?: string;
    maxDelayMs?: string;
  };
  normalizedUrl: string;
  normalizedSecret: string;
}

interface UseTestWebhookOptions {
  validation: WebhookValidation;
  maxAttemptsDraft: number;
  baseDelayDraft: number;
  maxDelayDraft: number;
  recordHistory: (entry: Omit<WebhookHistoryEntry, "id" | "created_at">) => void;
}

/**
 * Encapsula o envio de payload de teste para o webhook configurado,
 * com registro no histórico e feedback visual.
 */
export function useTestWebhook({
  validation,
  maxAttemptsDraft,
  baseDelayDraft,
  maxDelayDraft,
  recordHistory,
}: UseTestWebhookOptions) {
  const [isTesting, setIsTesting] = useState(false);

  const testWebhook = useCallback(async () => {
    if (validation.errors.url || !validation.normalizedUrl) {
      toast.error(validation.errors.url ?? "Informe uma URL http(s) válida antes de testar");
      return;
    }
    if (validation.errors.secret) {
      toast.error(`Segredo: ${validation.errors.secret}`);
      return;
    }
    if (validation.errors.maxAttempts || validation.errors.baseDelayMs || validation.errors.maxDelayMs) {
      toast.error("Corrija os parâmetros de retry antes de testar.");
      return;
    }

    const trimmed = validation.normalizedUrl;
    setIsTesting(true);
    const toastId = toast.loading("Enviando payload de teste…");
    const started = performance.now();

    try {
      const payload: WebhookExportPayload = {
        event: "security_alerts.export",
        filename: `teste-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`,
        format: "csv",
        count: 0,
        scope: "all",
        filters: { source: null, q: null, since_iso: new Date().toISOString() },
        generated_at: new Date().toISOString(),
      };
      const result = await sendExportWebhook(trimmed, payload, {
        secret: validation.normalizedSecret || undefined,
        maxAttempts: maxAttemptsDraft,
        baseDelayMs: baseDelayDraft,
        maxDelayMs: Math.max(baseDelayDraft, maxDelayDraft),
      });

      const latency = Math.round(performance.now() - started);
      recordHistory({
        url: trimmed,
        filename: payload.filename,
        format: payload.format,
        scope: payload.scope,
        count: payload.count,
        status: result.status,
        ok: result.ok,
        signed: Boolean(result.signed),
        latency_ms: latency,
        error: result.error,
        kind: "test",
        attempts: result.attempts,
        request_id: result.request_id,
        response_snippet: result.response_snippet,
        response_headers: result.response_headers,
        attempts_detail: result.attempts_detail,
      });

      toast.dismiss(toastId);
      if (result.ok) {
        const suffix = result.signed ? " · assinado (HMAC)" : "";
        const retryNote = result.attempts > 1 ? ` · ${result.attempts} tentativas` : "";
        toast.success(`Webhook OK (HTTP ${result.status})${suffix}${retryNote} · ${latency}ms`);
      } else {
        const retryNote = result.attempts > 1 ? ` (após ${result.attempts} tentativas)` : "";
        toast.error(`Webhook falhou${retryNote}: ${result.error ?? `HTTP ${result.status}`}`);
      }
    } finally {
      setIsTesting(false);
    }
  }, [validation, maxAttemptsDraft, baseDelayDraft, maxDelayDraft, recordHistory]);

  return { isTesting, testWebhook };
}
