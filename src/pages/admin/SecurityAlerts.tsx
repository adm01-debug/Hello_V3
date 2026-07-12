import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ShieldAlert, ExternalLink, CheckCircle2, RefreshCw, X, Archive } from "lucide-react";
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

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === ALL_SOURCES) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const [selectedId, setSelectedId] = useState<string | null>(null);


  const PAGE_SIZE = 50;
  const SINCE_ISO = useMemo(
    () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    [],
  );

  const alerts = useInfiniteQuery({
    queryKey: ["admin-security-alerts-30d", SINCE_ISO],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<SecurityNotification[]> => {
      let q = supabase
        .from("notifications")
        .select(
          "id, title, message, severity, type, action_url, action_label, source_type, is_read, read_at, created_at, metadata",
        )
        .eq("category", "security")
        .gte("created_at", SINCE_ISO)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (pageParam) q = q.lt("created_at", pageParam);
      const { data, error } = await q;
      if (error) throw error;
      return (data as SecurityNotification[]) ?? [];
    },
    getNextPageParam: (lastPage) =>
      lastPage.length < PAGE_SIZE ? undefined : lastPage[lastPage.length - 1]?.created_at ?? undefined,
    staleTime: 30_000,
  });

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

  const allData = useMemo<SecurityNotification[]>(
    () => alerts.data?.pages.flat() ?? [],
    [alerts.data],
  );

  // Infinite-scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && alerts.hasNextPage && !alerts.isFetchingNextPage) {
          void alerts.fetchNextPage();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [alerts.hasNextPage, alerts.isFetchingNextPage, alerts.fetchNextPage]);


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
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filtros</CardTitle>
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
              value={searchTerm}
              onChange={(e) => updateParam("q", e.target.value)}
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
            <div className="space-y-6">
              {days.map((day) => (
                <div key={day} className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    {format(new Date(`${day}T00:00:00`), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                  {grouped[day].map((n) => {
                    const sev = normalizeSeverity(n.severity);
                    return (
                      <div
                        key={n.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedId(n.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(n.id);
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
                            <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Lido
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
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

