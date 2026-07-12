import { useCallback, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  exportAlertsToCsv,
  exportAlertsToPdf,
  type ExportableAlert,
} from "@/lib/security-alerts-export";
import {
  sendExportWebhook,
  type WebhookExportPayload,
} from "@/lib/security-alerts-webhook";
import { enqueueWebhook } from "@/lib/security-alerts-webhook-queue";
import {
  normalizeSeverity,
  type SecurityNotification,
} from "@/components/security-alerts/VirtualTimeline";

export type ExportScope = "all" | "critical" | "unread";
export type ExportFormat = "csv" | "pdf";

const ALL_SOURCES = "__all__";

interface WebhookHistoryPayload {
  url: string;
  filename: string;
  format: ExportFormat;
  scope: ExportScope;
  count: number;
  status: number;
  ok: boolean;
  signed: boolean;
  latency_ms: number;
  error?: string;
  kind: "export";
  attempts: number;
}

interface UseAlertsExportParams {
  sinceIso: string;
  searchTerm: string;
  sourceFilter: string;
  webhookUrl: string;
  webhookSecret: string;
  webhookMaxAttempts: number;
  webhookBaseDelayMs: number;
  webhookMaxDelayMs: number;
  recordWebhookHistory: (entry: WebhookHistoryPayload) => void;
}

interface UseAlertsExportResult {
  isExporting: boolean;
  handleExport: (fmt: ExportFormat, scope?: ExportScope) => Promise<void>;
}

export function useAlertsExport({
  sinceIso,
  searchTerm,
  sourceFilter,
  webhookUrl,
  webhookSecret,
  webhookMaxAttempts,
  webhookBaseDelayMs,
  webhookMaxDelayMs,
  recordWebhookHistory,
}: UseAlertsExportParams): UseAlertsExportResult {
  const [isExporting, setIsExporting] = useState(false);

  const fetchAllFilteredAlerts = useCallback(async (): Promise<SecurityNotification[]> => {
    const CHUNK = 1000;
    const MAX_ROWS = 20000;
    const out: SecurityNotification[] = [];
    let cursor: { createdAt: string; id: string } | null = null;
    while (out.length < MAX_ROWS) {
      let q = supabase
        .from("notifications")
        .select(
          "id, title, message, severity, type, action_url, action_label, source_type, is_read, read_at, created_at, metadata",
        )
        .eq("category", "security")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(CHUNK);
      if (cursor) {
        q = q.or(
          `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
        );
      }
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data as SecurityNotification[]) ?? [];
      out.push(...rows);
      if (rows.length < CHUNK) break;
      const last = rows[rows.length - 1];
      cursor = { createdAt: last.created_at, id: last.id };
    }
    return out;
  }, [sinceIso]);

  const handleExport = useCallback(
    async (fmt: ExportFormat, scope: ExportScope = "all") => {
      setIsExporting(true);
      const scopeLabel =
        scope === "critical" ? "apenas críticos" : scope === "unread" ? "apenas não lidos" : "todos";
      const toastId = toast.loading(`Preparando exportação (${scopeLabel})…`);
      try {
        const rows = await fetchAllFilteredAlerts();
        const term = searchTerm.trim().toLowerCase();
        const filtered = rows.filter((n) => {
          if (sourceFilter !== ALL_SOURCES && (n.source_type ?? "") !== sourceFilter) return false;
          if (term) {
            const hay = `${n.title}\n${n.message}\n${n.source_type ?? ""}`.toLowerCase();
            if (!hay.includes(term)) return false;
          }
          if (scope === "critical" && normalizeSeverity(n.severity) !== "critical") return false;
          if (scope === "unread" && n.is_read) return false;
          return true;
        });
        if (filtered.length === 0) {
          toast.dismiss(toastId);
          toast.warning(`Nenhum alerta (${scopeLabel}) corresponde aos filtros — nada para exportar.`);
          return;
        }
        const payload: ExportableAlert[] = filtered.map((n) => ({
          id: n.id,
          created_at: n.created_at,
          severity: n.severity,
          type: n.type,
          source_type: n.source_type,
          title: n.title,
          message: n.message,
          is_read: n.is_read,
          read_at: n.read_at,
          action_url: n.action_url,
          metadata: n.metadata,
        }));
        const filename = fmt === "csv" ? exportAlertsToCsv(payload) : exportAlertsToPdf(payload);
        toast.dismiss(toastId);
        toast.success(
          `Exportado: ${filename} (${filtered.length} alerta${filtered.length === 1 ? "" : "s"}, ${scopeLabel})`,
        );
        if (webhookUrl) {
          const hookPayload: WebhookExportPayload = {
            event: "security_alerts.export",
            filename,
            format: fmt,
            count: filtered.length,
            scope,
            filters: {
              source: sourceFilter === ALL_SOURCES ? null : sourceFilter,
              q: searchTerm || null,
              since_iso: sinceIso,
            },
            generated_at: new Date().toISOString(),
          };
          const hookToast = toast.loading("Enviando ao webhook…");
          const started = performance.now();
          const result = await sendExportWebhook(webhookUrl, hookPayload, {
            secret: webhookSecret,
            maxAttempts: webhookMaxAttempts,
            baseDelayMs: webhookBaseDelayMs,
            maxDelayMs: Math.max(webhookBaseDelayMs, webhookMaxDelayMs),
          });
          const latency = Math.round(performance.now() - started);
          recordWebhookHistory({
            url: webhookUrl,
            filename,
            format: fmt,
            scope,
            count: filtered.length,
            status: result.status,
            ok: result.ok,
            signed: Boolean(result.signed),
            latency_ms: latency,
            error: result.error,
            kind: "export",
            attempts: result.attempts,
            request_id: result.request_id,
            response_snippet: result.response_snippet,
            response_headers: result.response_headers,
            attempts_detail: result.attempts_detail,
          });

          toast.dismiss(hookToast);
          if (result.ok) {
            const suffix = result.signed ? " · assinado (HMAC)" : "";
            const retryNote = result.attempts > 1 ? ` · ${result.attempts} tentativas` : "";
            toast.success(`Webhook OK (HTTP ${result.status})${suffix}${retryNote} · ${latency}ms`);
          } else {
            const retryNote = result.attempts > 1 ? ` (após ${result.attempts} tentativas)` : "";
            enqueueWebhook(
              webhookUrl,
              hookPayload,
              Boolean(webhookSecret?.trim()),
              result.error ?? `HTTP ${result.status}`,
            );
            toast.error(
              `Webhook falhou${retryNote}: ${result.error ?? `HTTP ${result.status}`} · adicionado à fila`,
            );
          }
        }
      } catch (err) {
        toast.dismiss(toastId);
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        toast.error(`Falha ao exportar: ${msg}`);
      } finally {
        setIsExporting(false);
      }
    },
    [
      fetchAllFilteredAlerts,
      searchTerm,
      sourceFilter,
      webhookUrl,
      webhookSecret,
      webhookMaxAttempts,
      webhookBaseDelayMs,
      webhookMaxDelayMs,
      sinceIso,
      recordWebhookHistory,
    ],
  );

  return { isExporting, handleExport };
}
