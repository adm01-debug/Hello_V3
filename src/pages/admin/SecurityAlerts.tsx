import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KpiStrip } from "@/components/security-alerts/KpiStrip";
import { AlertsDailyChart } from "@/components/security-alerts/AlertsDailyChart";
import { AlertsFilterBar } from "@/components/security-alerts/AlertsFilterBar";
import { AlertsHeader } from "@/components/security-alerts/AlertsHeader";
import { AlertsTimelineCard } from "@/components/security-alerts/AlertsTimelineCard";



import { useVirtualizer } from "@tanstack/react-virtual";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ShieldAlert, ExternalLink, CheckCircle2, RefreshCw, X, Archive, Download, FileText, FileSpreadsheet, AlertOctagon, MailWarning, Bookmark, BookmarkPlus, Trash2, Webhook } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  loadWebhookUrl,
  saveWebhookUrl,
  loadWebhookSecret,
  saveWebhookSecret,
  loadWebhookMaxAttempts,
  saveWebhookMaxAttempts,
  loadWebhookBaseDelayMs,
  saveWebhookBaseDelayMs,
  loadWebhookMaxDelayMs,
  saveWebhookMaxDelayMs,
  WEBHOOK_MAX_ATTEMPTS_MIN,
  WEBHOOK_MAX_ATTEMPTS_MAX,
  WEBHOOK_BASE_DELAY_MIN,
  WEBHOOK_BASE_DELAY_MAX,
  WEBHOOK_MAX_DELAY_MIN,
  WEBHOOK_MAX_DELAY_MAX,
  isValidHttpUrl,
  sendExportWebhook,
  type WebhookExportPayload,
} from "@/lib/security-alerts-webhook";
import {
  loadWebhookHistory,
  appendWebhookHistory,
  clearWebhookHistory,
  downloadWebhookHistoryCSV,
  type WebhookHistoryEntry,
} from "@/lib/security-alerts-webhook-history";
import {
  enqueueWebhook,
} from "@/lib/security-alerts-webhook-queue";
import { useWebhookQueue } from "@/hooks/useWebhookQueue";
import { useWebhookHistory } from "@/hooks/useWebhookHistory";

import { WebhookConfigDialog } from "@/components/security-alerts/WebhookConfigDialog";
import { AlertDetailsDialog } from "@/components/security-alerts/AlertDetailsDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  loadPresets,
  addPreset,
  removePreset,
  type AlertFilterPreset,
} from "@/lib/security-alerts-presets";
import { exportAlertsToCsv, exportAlertsToPdf, type ExportableAlert } from "@/lib/security-alerts-export";
import { usePageTitle } from "@/hooks/usePageTitle";
import { toast } from "sonner";
import { format, eachDayOfInterval, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useSearchParams } from "react-router-dom";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { PresetsMenu } from "@/components/security-alerts/PresetsMenu";

const ALL_SOURCES = "__all__";

import {
  VirtualTimeline,
  normalizeSeverity,
  severityBadgeVariant,
  type SecurityNotification,
  type Severity,
} from "@/components/security-alerts/VirtualTimeline";

const severityRank: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };
// Re-export for local usage of helpers already imported above
void normalizeSeverity;
void severityBadgeVariant;


function formatQueueAge(ms: number): string {
  if (ms <= 0) return "agora";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}


export default function SecurityAlerts() {
  usePageTitle("Alertas de Segurança");
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const sourceFilter = searchParams.get("source") ?? ALL_SOURCES;
  const searchTerm = searchParams.get("q") ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams);
      if (!value || value === ALL_SOURCES) next.delete(key);
      else next.set(key, value);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // Debounced search input — evita atualizar a URL/refetch a cada tecla.
  const [searchInput, setSearchInput] = useState(searchTerm);
  useEffect(() => {
    // Sincroniza quando a URL muda externamente (ex.: botão Limpar).
    setSearchInput(searchTerm);
  }, [searchTerm]);
  useEffect(() => {
    if (searchInput === searchTerm) return;
    const t = setTimeout(() => updateParam("q", searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput, searchTerm, updateParam]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Presets salvos (localStorage) — carregados uma vez e mantidos em estado
  // para revalidar após add/remove sem custo de leitura extra.
  const [presets, setPresets] = useState<AlertFilterPreset[]>(() => loadPresets());
  const refreshPresets = useCallback(() => setPresets(loadPresets()), []);

  const applyPreset = useCallback(
    (p: AlertFilterPreset) => {
      const next = new URLSearchParams();
      if (p.source && p.source !== ALL_SOURCES) next.set("source", p.source);
      if (p.q) next.set("q", p.q);
      setSearchParams(next, { replace: true });
      setSearchInput(p.q);
      toast.success(`Preset "${p.name}" aplicado`);
    },
    [setSearchParams],
  );

  const handleSavePreset = useCallback(() => {
    const name = window.prompt("Nome do preset:");
    if (!name) return;
    try {
      addPreset({ name, source: sourceFilter, q: searchTerm });
      refreshPresets();
      toast.success(`Preset "${name.trim()}" salvo`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar preset";
      toast.error(msg);
    }
  }, [refreshPresets, searchTerm, sourceFilter]);

  const handleRemovePreset = useCallback(
    (p: AlertFilterPreset) => {
      removePreset(p.id);
      refreshPresets();
      toast.success(`Preset "${p.name}" removido`);
    },
    [refreshPresets],
  );

  // Webhook de exportação — URL configurável por navegador (localStorage).
  const [webhookUrl, setWebhookUrl] = useState<string>(() => loadWebhookUrl());
  const [webhookSecret, setWebhookSecret] = useState<string>(() => loadWebhookSecret());
  const [webhookMaxAttempts, setWebhookMaxAttempts] = useState<number>(() => loadWebhookMaxAttempts());
  const [webhookBaseDelayMs, setWebhookBaseDelayMs] = useState<number>(() => loadWebhookBaseDelayMs());
  const [webhookMaxDelayMs, setWebhookMaxDelayMs] = useState<number>(() => loadWebhookMaxDelayMs());
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [webhookDraft, setWebhookDraft] = useState<string>("");
  const [webhookSecretDraft, setWebhookSecretDraft] = useState<string>("");
  const [webhookMaxAttemptsDraft, setWebhookMaxAttemptsDraft] = useState<number>(WEBHOOK_MAX_ATTEMPTS_MIN);
  const [webhookBaseDelayDraft, setWebhookBaseDelayDraft] = useState<number>(WEBHOOK_BASE_DELAY_MIN);
  const [webhookMaxDelayDraft, setWebhookMaxDelayDraft] = useState<number>(WEBHOOK_MAX_DELAY_MIN);
  const openWebhookDialog = useCallback(() => {
    setWebhookDraft(webhookUrl);
    setWebhookSecretDraft(webhookSecret);
    setWebhookMaxAttemptsDraft(webhookMaxAttempts);
    setWebhookBaseDelayDraft(webhookBaseDelayMs);
    setWebhookMaxDelayDraft(webhookMaxDelayMs);
    setWebhookDialogOpen(true);
  }, [webhookUrl, webhookSecret, webhookMaxAttempts, webhookBaseDelayMs, webhookMaxDelayMs]);
  const handleSaveWebhook = useCallback(() => {
    const trimmed = webhookDraft.trim();
    if (trimmed && !isValidHttpUrl(trimmed)) {
      toast.error("URL inválida — use http(s)://…");
      return;
    }
    const clampedAttempts = Math.max(
      WEBHOOK_MAX_ATTEMPTS_MIN,
      Math.min(WEBHOOK_MAX_ATTEMPTS_MAX, Math.floor(webhookMaxAttemptsDraft || WEBHOOK_MAX_ATTEMPTS_MIN)),
    );
    const clampedBase = Math.max(
      WEBHOOK_BASE_DELAY_MIN,
      Math.min(WEBHOOK_BASE_DELAY_MAX, Math.floor(webhookBaseDelayDraft || WEBHOOK_BASE_DELAY_MIN)),
    );
    let clampedMax = Math.max(
      WEBHOOK_MAX_DELAY_MIN,
      Math.min(WEBHOOK_MAX_DELAY_MAX, Math.floor(webhookMaxDelayDraft || WEBHOOK_MAX_DELAY_MIN)),
    );
    if (clampedMax < clampedBase) clampedMax = clampedBase;
    saveWebhookUrl(trimmed);
    saveWebhookSecret(webhookSecretDraft);
    saveWebhookMaxAttempts(clampedAttempts);
    saveWebhookBaseDelayMs(clampedBase);
    saveWebhookMaxDelayMs(clampedMax);
    setWebhookUrl(trimmed);
    setWebhookSecret(webhookSecretDraft.trim());
    setWebhookMaxAttempts(clampedAttempts);
    setWebhookBaseDelayMs(clampedBase);
    setWebhookMaxDelayMs(clampedMax);
    setWebhookDialogOpen(false);
    toast.success(trimmed ? "Webhook salvo" : "Webhook removido");
  }, [webhookDraft, webhookSecretDraft, webhookMaxAttemptsDraft, webhookBaseDelayDraft, webhookMaxDelayDraft]);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const {
    pendingCount: webhookPendingCount,
    oldestAgeMs: webhookOldestAgeMs,
    isFlushing: isFlushingQueue,
    flushedAt: webhookQueueFlushedAt,
    flush: handleFlushQueue,
    clear: handleClearQueue,
  } = useWebhookQueue();
  const {
    history: webhookHistory,
    record: recordWebhookHistory,
    clear: handleClearWebhookHistory,
    exportCsv: handleExportWebhookHistory,
  } = useWebhookHistory(webhookQueueFlushedAt);

  const handleTestWebhook = useCallback(async () => {
    const trimmed = webhookDraft.trim();
    if (!trimmed || !isValidHttpUrl(trimmed)) {
      toast.error("Informe uma URL http(s) válida antes de testar");
      return;
    }
    setIsTestingWebhook(true);
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
        secret: webhookSecretDraft.trim() || undefined,
        maxAttempts: webhookMaxAttemptsDraft,
        baseDelayMs: webhookBaseDelayDraft,
        maxDelayMs: Math.max(webhookBaseDelayDraft, webhookMaxDelayDraft),
      });
      const latency = Math.round(performance.now() - started);
      recordWebhookHistory({
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
      setIsTestingWebhook(false);
    }
  }, [webhookDraft, webhookSecretDraft, webhookMaxAttemptsDraft, webhookBaseDelayDraft, webhookMaxDelayDraft, recordWebhookHistory]);




  const PAGE_SIZE = 50;
  const SINCE_ISO = useMemo(
    () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    [],
  );

  // Cursor composto (created_at, id) — evita duplicatas/buracos quando vários
  // alertas compartilham o mesmo timestamp (comum em bursts do mesmo trigger).
  type Cursor = { createdAt: string; id: string } | null;

  const alerts = useInfiniteQuery({
    queryKey: ["admin-security-alerts-30d", SINCE_ISO],
    initialPageParam: null as Cursor,
    queryFn: async ({ pageParam }): Promise<SecurityNotification[]> => {
      let q = supabase
        .from("notifications")
        .select(
          "id, title, message, severity, type, action_url, action_label, source_type, is_read, read_at, created_at, metadata",
        )
        .eq("category", "security")
        .gte("created_at", SINCE_ISO)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(PAGE_SIZE);
      if (pageParam) {
        // (created_at, id) < (cursor.createdAt, cursor.id) em ordem lexicográfica
        // desc: created_at < cursor OR (created_at = cursor AND id < cursor.id)
        q = q.or(
          `created_at.lt.${pageParam.createdAt},and(created_at.eq.${pageParam.createdAt},id.lt.${pageParam.id})`,
        );
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data as SecurityNotification[]) ?? [];
    },
    getNextPageParam: (lastPage): Cursor => {
      if (lastPage.length < PAGE_SIZE) return null;
      const last = lastPage[lastPage.length - 1];
      return last ? { createdAt: last.created_at, id: last.id } : null;
    },
    staleTime: 30_000,
  });

  // Ao mudar filtros: revalida páginas já carregadas (traz updates recentes
  // como is_read alterados por outros clientes) sem descartar o histórico.
  const filterKey = `${sourceFilter}::${searchTerm}`;
  const firstFilterRun = useRef(true);
  useEffect(() => {
    if (firstFilterRun.current) {
      firstFilterRun.current = false;
      return;
    }
    void alerts.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);



  useEffect(() => {
    const channel = supabase
      .channel("admin-security-alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: "category=eq.security" },
        () => qc.invalidateQueries({ queryKey: ["admin-security-alerts-30d"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  const markRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Falha ao marcar como lida");
      return;
    }
    toast.success("Alerta marcado como lido");
    void alerts.refetch();
  };

  const markAllRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in("id", ids);
    if (error) {
      toast.error("Falha ao marcar todos como lidos");
      return;
    }
    toast.success(`${ids.length} alertas marcados como lidos`);
    void alerts.refetch();
  };

  const markResolved = async (id: string) => {
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: nowIso, is_archived: true })
      .eq("id", id);
    if (error) {
      toast.error("Falha ao marcar como resolvido");
      return;
    }
    toast.success("Alerta resolvido e arquivado");
    setSelectedId(null);
    void alerts.refetch();
  };

  // Busca todos os alertas dos últimos 30 dias respeitando os filtros ativos
  // (paginando com o mesmo cursor composto usado na UI). Necessário para
  // exportar mesmo quando o usuário ainda não rolou a timeline até o fim.
  const [isExporting, setIsExporting] = useState(false);
  const fetchAllFilteredAlerts = useCallback(async (): Promise<SecurityNotification[]> => {
    const CHUNK = 1000;
    const MAX_ROWS = 20000; // salvaguarda para memória do navegador
    const out: SecurityNotification[] = [];
    let cursor: { createdAt: string; id: string } | null = null;
    while (out.length < MAX_ROWS) {
      let q = supabase
        .from("notifications")
        .select(
          "id, title, message, severity, type, action_url, action_label, source_type, is_read, read_at, created_at, metadata",
        )
        .eq("category", "security")
        .gte("created_at", SINCE_ISO)
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
  }, [SINCE_ISO]);

  type ExportScope = "all" | "critical" | "unread";
  const handleExport = useCallback(
    async (fmt: "csv" | "pdf", scope: ExportScope = "all") => {
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
        // Notifica webhook configurado (best-effort — falha não bloqueia export).
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
              since_iso: SINCE_ISO,
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
          });
          toast.dismiss(hookToast);
          if (result.ok) {
            const suffix = result.signed ? " · assinado (HMAC)" : "";
            const retryNote = result.attempts > 1 ? ` · ${result.attempts} tentativas` : "";
            toast.success(`Webhook OK (HTTP ${result.status})${suffix}${retryNote} · ${latency}ms`);
          } else {
            const retryNote = result.attempts > 1 ? ` (após ${result.attempts} tentativas)` : "";
            enqueueWebhook(webhookUrl, hookPayload, Boolean(webhookSecret?.trim()), result.error ?? `HTTP ${result.status}`);
            toast.error(`Webhook falhou${retryNote}: ${result.error ?? `HTTP ${result.status}`} · adicionado à fila`);
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
    [fetchAllFilteredAlerts, searchTerm, sourceFilter, webhookUrl, webhookSecret, webhookMaxAttempts, webhookBaseDelayMs, webhookMaxDelayMs, SINCE_ISO, recordWebhookHistory],

  );

  const allData = useMemo<SecurityNotification[]>(
    () => alerts.data?.pages.flat() ?? [],
    [alerts.data],
  );

  // Infinite-scroll sentinel — pausa auto-fetch quando há erro na próxima
  // página para não entrar em loop de tentativas; usuário reativa via botão.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          alerts.hasNextPage &&
          !alerts.isFetchingNextPage &&
          !alerts.isFetchNextPageError
        ) {
          void alerts.fetchNextPage();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [alerts.hasNextPage, alerts.isFetchingNextPage, alerts.isFetchNextPageError, alerts.fetchNextPage]);


  const availableSources = useMemo(() => {
    const set = new Set<string>();
    for (const n of allData) if (n.source_type) set.add(n.source_type);
    return Array.from(set).sort();
  }, [allData]);

  const data = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allData.filter((n) => {
      if (sourceFilter !== ALL_SOURCES && (n.source_type ?? "") !== sourceFilter) return false;
      if (term) {
        const hay = `${n.title}\n${n.message}\n${n.source_type ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [allData, sourceFilter, searchTerm]);

  const unreadCount = data.filter((a) => !a.is_read).length;
  const criticalCount = data.filter((a) => normalizeSeverity(a.severity) === "critical").length;
  const hasActiveFilters = sourceFilter !== ALL_SOURCES || searchTerm.length > 0;

  // Agrupa por dia (YYYY-MM-DD) e ordena severidade dentro do dia
  const grouped = data.reduce<Record<string, SecurityNotification[]>>((acc, n) => {
    const day = format(new Date(n.created_at), "yyyy-MM-dd");
    (acc[day] ??= []).push(n);
    return acc;
  }, {});
  const days = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));
  for (const d of days) {
    grouped[d].sort(
      (a, b) => severityRank[normalizeSeverity(a.severity)] - severityRank[normalizeSeverity(b.severity)],
    );
  }

  // Série completa de 30 dias (preenche dias sem alertas com 0)
  const chartData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of data) {
      const day = format(new Date(n.created_at), "yyyy-MM-dd");
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    const today = startOfDay(new Date());
    const start = subDays(today, 29);
    return eachDayOfInterval({ start, end: today }).map((d) => {
      const key = format(d, "yyyy-MM-dd");
      return {
        day: key,
        label: format(d, "dd/MM"),
        count: counts.get(key) ?? 0,
      };
    });
  }, [data]);


  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl">
      <AlertsHeader
        onRefresh={() => alerts.refetch()}
        onExport={handleExport}
        isExporting={isExporting}
        onOpenWebhookDialog={openWebhookDialog}
        webhookConfigured={!!webhookUrl}
        onMarkAllRead={() => markAllRead(data.filter((a) => !a.is_read).map((a) => a.id))}
        unreadCount={unreadCount}
        hasActiveFilters={hasActiveFilters}
      />

      <KpiStrip
        total={data.length}
        unread={unreadCount}
        critical={criticalCount}
        webhookPending={webhookPendingCount}
        webhookOldestLabel={formatQueueAge(webhookOldestAgeMs)}
      />



      <AlertsFilterBar
        sourceFilter={sourceFilter}
        allSourcesToken={ALL_SOURCES}
        availableSources={availableSources}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onSourceChange={(v) => updateParam("source", v)}
        onClear={() => setSearchParams(new URLSearchParams(), { replace: true })}
        hasActiveFilters={hasActiveFilters}
        filteredCount={data.length}
        totalCount={allData.length}
        presets={presets}
        onApplyPreset={applyPreset}
        onRemovePreset={handleRemovePreset}
        onSavePreset={handleSavePreset}
      />


      <AlertsDailyChart data={chartData} />


      <AlertsTimelineCard
        isLoading={alerts.isLoading}
        days={days}
        grouped={grouped}
        onSelect={setSelectedId}
        onMarkRead={markRead}
        sentinelRef={sentinelRef}
        isFetchingNextPage={alerts.isFetchingNextPage}
        hasNextPage={!!alerts.hasNextPage}
        totalLoaded={allData.length}
        onLoadMore={() => void alerts.fetchNextPage()}
        resetKey={filterKey}
        nextPageError={alerts.isFetchNextPageError ? alerts.error : null}
      />



      <AlertDetailsDialog
        alert={allData.find((a) => a.id === selectedId) ?? null}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onMarkRead={markRead}
        onMarkResolved={markResolved}
      />

      <WebhookConfigDialog
        open={webhookDialogOpen}
        onOpenChange={setWebhookDialogOpen}
        webhookUrl={webhookUrl}
        webhookSecret={webhookSecret}
        webhookDraft={webhookDraft}
        setWebhookDraft={setWebhookDraft}
        webhookSecretDraft={webhookSecretDraft}
        setWebhookSecretDraft={setWebhookSecretDraft}
        webhookMaxAttemptsDraft={webhookMaxAttemptsDraft}
        setWebhookMaxAttemptsDraft={setWebhookMaxAttemptsDraft}
        webhookBaseDelayDraft={webhookBaseDelayDraft}
        setWebhookBaseDelayDraft={setWebhookBaseDelayDraft}
        webhookMaxDelayDraft={webhookMaxDelayDraft}
        setWebhookMaxDelayDraft={setWebhookMaxDelayDraft}
        webhookHistory={webhookHistory}
        webhookPendingCount={webhookPendingCount}
        isTestingWebhook={isTestingWebhook}
        isFlushingQueue={isFlushingQueue}
        onSave={handleSaveWebhook}
        onTest={handleTestWebhook}
        onFlushQueue={handleFlushQueue}
        onClearQueue={handleClearQueue}
        onExportHistory={handleExportWebhookHistory}
        onClearHistory={handleClearWebhookHistory}
      />
    </div>

  );
}



