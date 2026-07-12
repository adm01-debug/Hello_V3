import { useCallback, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";

export type SecurityNotification = {
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

export type Severity = "critical" | "warning" | "info";

export function normalizeSeverity(s: string): Severity {
  if (s === "critical" || s === "error") return "critical";
  if (s === "warning") return "warning";
  return "info";
}

export function severityBadgeVariant(s: Severity): "destructive" | "secondary" | "outline" {
  if (s === "critical") return "destructive";
  if (s === "warning") return "secondary";
  return "outline";
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

export function VirtualTimeline({
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

  useEffect(() => {
    parentRef.current?.scrollTo({ top: 0 });
  }, [resetKey]);

  const estimateSize = useCallback(
    (index: number) => {
      const r = rows[index];
      if (!r) return 96;
      if (r.kind === "day") return 32;
      if (r.kind === "footer") return 120;
      return 108;
    },
    [rows],
  );

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
                      <p className="font-medium text-destructive">Falha ao carregar mais alertas</p>
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
                      Fim da timeline — {totalLoaded} alerta{totalLoaded === 1 ? "" : "s"} carregado
                      {totalLoaded === 1 ? "" : "s"}.
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
