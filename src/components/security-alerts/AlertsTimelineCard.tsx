import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VirtualTimeline, type SecurityNotification } from "./VirtualTimeline";
import type { RefObject } from "react";

interface AlertsTimelineCardProps {
  isLoading: boolean;
  days: string[];
  grouped: Record<string, SecurityAlertRow[]>;
  onSelect: (id: string) => void;
  onMarkRead: (id: string) => void;
  sentinelRef: RefObject<HTMLDivElement>;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  totalLoaded: number;
  onLoadMore: () => void;
  resetKey: string;
  nextPageError: unknown;
}

export function AlertsTimelineCard({
  isLoading,
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
}: AlertsTimelineCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
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
            onSelect={onSelect}
            onMarkRead={onMarkRead}
            sentinelRef={sentinelRef}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            totalLoaded={totalLoaded}
            onLoadMore={onLoadMore}
            resetKey={resetKey}
            nextPageError={nextPageError}
          />
        )}
      </CardContent>
    </Card>
  );
}
