import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, ExternalLink, CheckCircle2, RefreshCw } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

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

  const alerts = useQuery({
    queryKey: ["admin-security-alerts-30d"],
    queryFn: async (): Promise<SecurityNotification[]> => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, message, severity, type, action_url, action_label, source_type, is_read, read_at, created_at, metadata")
        .eq("category", "security")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data as SecurityNotification[]) ?? [];
    },
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

  const markAllRead = async () => {
    const unread = (alerts.data ?? []).filter((a) => !a.is_read).map((a) => a.id);
    if (unread.length === 0) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in("id", unread);
    if (error) {
      toast.error("Falha ao marcar todos como lidos");
      return;
    }
    toast.success(`${unread.length} alertas marcados como lidos`);
    void alerts.refetch();
  };

  const data = alerts.data ?? [];
  const unreadCount = data.filter((a) => !a.is_read).length;
  const criticalCount = data.filter((a) => normalizeSeverity(a.severity) === "critical").length;

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
          <Button variant="secondary" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Marcar todos como lidos ({unreadCount})
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
                        className={`p-3 rounded-md border bg-card/50 flex gap-3 ${
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
                          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {n.message}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
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
    </div>
  );
}
