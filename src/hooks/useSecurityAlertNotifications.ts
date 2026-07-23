import { useCallback, useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, eachDayOfInterval, subDays, startOfDay } from "date-fns";
import {
  normalizeSeverity,
  type SecurityNotification,
  type Severity,
} from "@/components/security-alerts/VirtualTimeline";

import { safeFormatDate } from "@/lib/safe-date";
const ALL_SOURCES = "__all__";
const PAGE_SIZE = 50;
const severityRank: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };

type Cursor = { createdAt: string; id: string } | null;

interface UseSecurityAlertNotificationsOptions {
  sourceFilter: string;
  searchTerm: string;
}

/**
 * Encapsula fetch paginado (cursor composto), realtime subscription,
 * mutations (mark read/resolved) e derivações para gráfico/timeline.
 */
export function useSecurityAlertNotifications({
  sourceFilter,
  searchTerm,
}: UseSecurityAlertNotificationsOptions) {
  const qc = useQueryClient();

  const sinceIso = useMemo(
    () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    [],
  );

  const alerts = useInfiniteQuery({
    queryKey: ["admin-security-alerts-30d", sinceIso, sourceFilter, searchTerm],
    initialPageParam: null as Cursor,
    queryFn: async ({ pageParam }): Promise<SecurityNotification[]> => {
      let q = supabase
        .from("notifications")
        .select(
          "id, title, message, severity, type, action_url, action_label, source_type, is_read, read_at, created_at, metadata",
        )
        .eq("category", "security")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(PAGE_SIZE);
      if (sourceFilter !== ALL_SOURCES) {
        q = q.eq("source_type", sourceFilter);
      }
      const term = searchTerm.trim();
      if (term) {
        const escaped = term.replace(/[%,()]/g, "\\$&");
        q = q.or(`title.ilike.%${escaped}%,message.ilike.%${escaped}%`);
      }
      if (pageParam) {
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

  const availableSourcesQuery = useQuery({
    queryKey: ["admin-security-alerts-sources-30d", sinceIso],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("source_type")
        .eq("category", "security")
        .gte("created_at", sinceIso)
        .not("source_type", "is", null)
        .limit(5000);
      if (error) throw error;
      const set = new Set<string>();
      for (const row of (data ?? []) as Array<{ source_type: string | null }>) {
        if (row.source_type) set.add(row.source_type);
      }
      return Array.from(set).sort();
    },
    staleTime: 5 * 60_000,
  });

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

  const grouped = useMemo(() => {
    const g = allData.reduce<Record<string, SecurityNotification[]>>((acc, n) => {
      const day = safeFormatDate(n.created_at, "yyyy-MM-dd");
      (acc[day] ??= []).push(n);
      return acc;
    }, {});
    for (const d of Object.keys(g)) {
      g[d].sort(
        (a, b) => severityRank[normalizeSeverity(a.severity)] - severityRank[normalizeSeverity(b.severity)],
      );
    }
    return g;
  }, [allData]);

  const days = useMemo(
    () => Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1)),
    [grouped],
  );

  const chartData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of allData) {
      const day = safeFormatDate(n.created_at, "yyyy-MM-dd");
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    const today = startOfDay(new Date());
    const start = subDays(today, 29);
    return eachDayOfInterval({ start, end: today }).map((d) => {
      const key = format(d, "yyyy-MM-dd");
      return { day: key, label: format(d, "dd/MM"), count: counts.get(key) ?? 0 };
    });
  }, [allData]);

  const markRead = useCallback(async (id: string) => {
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
  }, [alerts]);

  const markAllRead = useCallback(async (ids: string[]) => {
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
  }, [alerts]);

  const markResolved = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString(), is_archived: true })
      .eq("id", id);
    if (error) {
      toast.error("Falha ao marcar como resolvido");
      return;
    }
    toast.success("Alerta resolvido e arquivado");
    void alerts.refetch();
  }, [alerts]);

  return {
    alerts,
    allData,
    grouped,
    days,
    chartData,
    availableSources: availableSourcesQuery.data ?? [],
    sentinelRef,
    sinceIso,
    markRead,
    markAllRead,
    markResolved,
  };
}
