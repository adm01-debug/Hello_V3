import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Snapshot } from "./types";

interface Props {
  isLoading: boolean;
  data?: Snapshot;
}

export function ActivityCards({ isLoading, data }: Props) {
  const keys = ["total_connections", "active", "idle", "idle_in_txn"] as const;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {keys.map((key) => (
        <Card key={key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">
              {key.replace(/_/g, " ")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{data?.activity?.[key] ?? 0}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
