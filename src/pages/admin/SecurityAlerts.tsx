import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  isValidHttpUrl,
  sendExportWebhook,
  type WebhookExportPayload,
} from "@/lib/security-alerts-webhook";
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

const ALL_SOURCES = "__all__";

type SecurityNotification = {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical" | "error" | string;
  type: string;
  action_url: string | null;
  action_label: string | null;
  source_type: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

type Severity = "critical" | "warning" | "info";

const severityRank: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };

function normalizeSeverity(s: string): Severity {
  if (s === "critical" || s === "error") return "critical";
  if (s === "warning") return "warning";
  return "info";
}

function severityBadgeVariant(s: Severity): "destructive" | "secondary" | "outline" {
  if (s === "critical") return "destructive";
  if (s === "warning") return "secondary";
  return "outline";
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
      } catch (err) {
        toast.dismiss(toastId);
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        toast.error(`Falha ao exportar: ${msg}`);
      } finally {
        setIsExporting(false);
      }
    },
    [fetchAllFilteredAlerts, searchTerm, sourceFilter],
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            Alertas de Segurança
          </h1>
          <p className="text-sm text-muted-foreground">
            Timeline dos últimos 30 dias — categoria <code className="font-mono">security</code>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => alerts.refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? "Exportando…" : "Exportar"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Todos os alertas filtrados</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => void handleExport("csv", "all")} disabled={isExporting}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV (Excel / planilha)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleExport("pdf", "all")} disabled={isExporting}>
                <FileText className="w-4 h-4 mr-2" />
                PDF (relatório)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <AlertOctagon className="w-4 h-4 mr-2 text-destructive" />
                  Apenas críticos
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => void handleExport("csv", "critical")} disabled={isExporting}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void handleExport("pdf", "critical")} disabled={isExporting}>
                      <FileText className="w-4 h-4 mr-2" />
                      PDF
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <MailWarning className="w-4 h-4 mr-2" />
                  Apenas não lidos
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => void handleExport("csv", "unread")} disabled={isExporting}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void handleExport("pdf", "unread")} disabled={isExporting}>
                      <FileText className="w-4 h-4 mr-2" />
                      PDF
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAllRead(data.filter((a) => !a.is_read).map((a) => a.id))}
            disabled={unreadCount === 0}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Marcar {hasActiveFilters ? "filtrados" : "todos"} como lidos ({unreadCount})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{data.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Não lidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-destructive">{criticalCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Filtros</CardTitle>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Presets {presets.length > 0 ? `(${presets.length})` : ""}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Presets salvos</DropdownMenuLabel>
                {presets.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-muted-foreground">
                    Nenhum preset ainda. Ajuste os filtros e clique em "Salvar como preset".
                  </div>
                ) : (
                  presets.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-1 px-1 py-0.5 hover:bg-accent/50 rounded-sm"
                    >
                      <button
                        type="button"
                        onClick={() => applyPreset(p)}
                        className="flex-1 text-left px-2 py-1.5 text-sm truncate"
                        title={`origem: ${p.source === ALL_SOURCES ? "todas" : p.source} • busca: ${p.q || "—"}`}
                      >
                        <div className="truncate font-medium">{p.name}</div>
                        <div className="truncate text-[10px] text-muted-foreground font-mono">
                          {p.source === ALL_SOURCES ? "todas" : p.source}
                          {p.q ? ` · "${p.q}"` : ""}
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => handleRemovePreset(p)}
                        title="Remover preset"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSavePreset}>
                  <BookmarkPlus className="w-4 h-4 mr-2" />
                  Salvar filtros atuais como preset
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-3">
            <Select value={sourceFilter} onValueChange={(v) => updateParam("source", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Origem (source_type)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SOURCES}>Todas as origens</SelectItem>
                {availableSources.map((s) => (
                  <SelectItem key={s} value={s} className="font-mono text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Buscar por título, mensagem ou origem…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}
              disabled={!hasActiveFilters}
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          </div>
          {hasActiveFilters && (
            <p className="text-xs text-muted-foreground mt-2">
              Exibindo {data.length} de {allData.length} alertas com os filtros aplicados.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Alertas por dia (últimos 30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={16}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "hsl(var(--popover-foreground))",
                  }}
                  labelFormatter={(_, payload) => {
                    const d = payload?.[0]?.payload?.day as string | undefined;
                    return d
                      ? format(new Date(`${d}T00:00:00`), "EEEE, dd 'de' MMMM", { locale: ptBR })
                      : "";
                  }}
                  formatter={(v) => [Number(v ?? 0), "Alertas"] as [number, string]}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : days.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum alerta de segurança nos últimos 30 dias. 🎉
            </p>
          ) : (
            <VirtualTimeline
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
          )}
        </CardContent>
      </Card>


      <AlertDetailsDialog
        alert={allData.find((a) => a.id === selectedId) ?? null}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onMarkRead={markRead}
        onMarkResolved={markResolved}
      />
    </div>
  );
}

interface AlertDetailsDialogProps {
  alert: SecurityNotification | null;
  onOpenChange: (open: boolean) => void;
  onMarkRead: (id: string) => void | Promise<void>;
  onMarkResolved: (id: string) => void | Promise<void>;
}

function AlertDetailsDialog({ alert, onOpenChange, onMarkRead, onMarkResolved }: AlertDetailsDialogProps) {
  const open = alert !== null;
  const sev = alert ? normalizeSeverity(alert.severity) : "info";
  const payload = alert?.metadata ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {alert && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={severityBadgeVariant(sev)}>{sev}</Badge>
                {alert.source_type && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {alert.source_type}
                  </Badge>
                )}
                <Badge variant="outline" className="font-mono text-xs">
                  {alert.type}
                </Badge>
              </div>
              <DialogTitle className="text-left">{alert.title}</DialogTitle>
              <DialogDescription className="text-left whitespace-pre-wrap">
                {alert.message}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-md border bg-muted/30">
                <div className="text-xs uppercase text-muted-foreground">Criado em</div>
                <div className="font-mono">
                  {format(new Date(alert.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                </div>
              </div>
              <div className="p-3 rounded-md border bg-muted/30">
                <div className="text-xs uppercase text-muted-foreground">Lido em</div>
                <div className="font-mono">
                  {alert.read_at
                    ? format(new Date(alert.read_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
                    : "—"}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1">Payload completo</div>
              <pre className="text-xs p-3 rounded-md border bg-muted/30 overflow-auto max-h-72 font-mono">
                {payload && Object.keys(payload).length > 0
                  ? JSON.stringify(payload, null, 2)
                  : "// sem metadata"}
              </pre>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {alert.action_url && (
                <Button asChild variant="outline">
                  <Link to={alert.action_url}>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    {alert.action_label ?? "Abrir"}
                  </Link>
                </Button>
              )}
              {!alert.is_read && (
                <Button variant="secondary" onClick={() => onMarkRead(alert.id)}>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Marcar como lido
                </Button>
              )}
              <Button variant="default" onClick={() => onMarkResolved(alert.id)}>
                <Archive className="w-4 h-4 mr-1" />
                Marcar como resolvido
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

type TimelineRow =
  | { kind: "day"; day: string; key: string }
  | { kind: "alert"; day: string; alert: SecurityNotification; key: string }
  | { kind: "footer"; key: string };

interface VirtualTimelineProps {
  days: string[];
  grouped: Record<string, SecurityNotification[]>;
  onSelect: (id: string) => void;
  onMarkRead: (id: string) => void | Promise<void>;
  sentinelRef: React.MutableRefObject<HTMLDivElement | null>;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  totalLoaded: number;
  onLoadMore: () => void;
  resetKey: string;
  nextPageError: unknown;
}

function VirtualTimeline({
  days,
  grouped,
  onSelect,
  onMarkRead,
  sentinelRef,
  isFetchingNextPage,
  hasNextPage,
  totalLoaded,
  onLoadMore,
  resetKey,
  nextPageError,
}: VirtualTimelineProps) {
  const nextPageErrorMessage =
    nextPageError instanceof Error ? nextPageError.message : nextPageError ? String(nextPageError) : null;
  const rows = useMemo<TimelineRow[]>(() => {
    const out: TimelineRow[] = [];
    for (const day of days) {
      out.push({ kind: "day", day, key: `d-${day}` });
      for (const a of grouped[day]) out.push({ kind: "alert", day, alert: a, key: `a-${a.id}` });
    }
    out.push({ kind: "footer", key: "footer" });
    return out;
  }, [days, grouped]);

  const parentRef = useRef<HTMLDivElement | null>(null);

  // Reset de scroll ao topo quando filtros mudam — paginação virtual
  // sempre reinicia no primeiro item visível do novo subconjunto.
  useEffect(() => {
    parentRef.current?.scrollTo({ top: 0 });
  }, [resetKey]);


  const estimateSize = useCallback((index: number) => {
    const r = rows[index];
    if (!r) return 96;
    if (r.kind === "day") return 32;
    if (r.kind === "footer") return 120;
    return 108;
  }, [rows]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 8,
    getItemKey: (i) => rows[i]?.key ?? i,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="relative max-h-[70vh] overflow-y-auto pr-1"
      style={{ contain: "strict" }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
        {items.map((v) => {
          const row = rows[v.index];
          if (!row) return null;
          return (
            <div
              key={v.key}
              data-index={v.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${v.start}px)`,
              }}
              className="pb-2"
            >
              {row.kind === "day" && (
                <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium pt-2">
                  {format(new Date(`${row.day}T00:00:00`), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
              )}
              {row.kind === "alert" && (
                <AlertRow alert={row.alert} onSelect={onSelect} onMarkRead={onMarkRead} />
              )}
              {row.kind === "footer" && (
                <div className="pt-2">
                  <div ref={sentinelRef} aria-hidden className="h-1" />
                  {isFetchingNextPage && (
                    <div className="space-y-2 pt-2">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  )}
                  {nextPageErrorMessage && !isFetchingNextPage && (
                    <div
                      role="alert"
                      className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm"
                    >
                      <p className="font-medium text-destructive">
                        Falha ao carregar mais alertas
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 break-words">
                        {nextPageErrorMessage}
                      </p>
                      <div className="flex justify-end pt-2">
                        <Button variant="destructive" size="sm" onClick={onLoadMore}>
                          <RefreshCw className="w-3.5 h-3.5 mr-1" />
                          Tentar novamente
                        </Button>
                      </div>
                    </div>
                  )}
                  {!hasNextPage && totalLoaded > 0 && !nextPageErrorMessage && (
                    <p className="text-center text-xs text-muted-foreground pt-4">
                      Fim da timeline — {totalLoaded} alerta{totalLoaded === 1 ? "" : "s"} carregado{totalLoaded === 1 ? "" : "s"}.
                    </p>
                  )}
                  {hasNextPage && !isFetchingNextPage && !nextPageErrorMessage && (
                    <div className="flex justify-center pt-2">
                      <Button variant="outline" size="sm" onClick={onLoadMore}>
                        Carregar mais
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AlertRowProps {
  alert: SecurityNotification;
  onSelect: (id: string) => void;
  onMarkRead: (id: string) => void | Promise<void>;
}

function AlertRow({ alert: n, onSelect, onMarkRead }: AlertRowProps) {
  const sev = normalizeSeverity(n.severity);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(n.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(n.id);
        }
      }}
      className={`p-3 rounded-md border bg-card/50 flex gap-3 cursor-pointer hover:bg-accent/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        n.is_read ? "opacity-60" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={severityBadgeVariant(sev)}>{sev}</Badge>
          {n.source_type && (
            <Badge variant="outline" className="font-mono text-xs">
              {n.source_type}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {format(new Date(n.created_at), "HH:mm:ss")}
          </span>
        </div>
        <div className="font-medium mt-1">{n.title}</div>
        <div className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-2">
          {n.message}
        </div>
      </div>
      <div className="flex flex-col gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
        {n.action_url && (
          <Button asChild variant="outline" size="sm">
            <Link to={n.action_url}>
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              {n.action_label ?? "Abrir"}
            </Link>
          </Button>
        )}
        {!n.is_read && (
          <Button variant="ghost" size="sm" onClick={() => onMarkRead(n.id)}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Lido
          </Button>
        )}
      </div>
    </div>
  );
}

