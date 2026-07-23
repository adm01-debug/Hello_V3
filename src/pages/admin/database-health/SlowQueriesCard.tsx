import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Gauge } from "lucide-react";
import type { SlowQuery } from "./types";

interface Props {
  isLoading: boolean;
  queries?: SlowQuery[];
}

export function SlowQueriesCard({ isLoading, queries }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          Top 15 consultas mais lentas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : queries && queries.length > 0 ? (
          <div className="space-y-2">
            {queries.map((q, i) => (
              <div key={i} className="p-3 rounded-md border bg-card/50 space-y-1">
                <pre className="text-xs font-mono whitespace-pre-wrap break-all text-muted-foreground">
                  {q.query}
                </pre>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">{q.calls.toLocaleString()} calls</Badge>
                  <Badge variant="outline">média {q.mean_ms} ms</Badge>
                  <Badge variant="outline">máx {q.max_ms} ms</Badge>
                  <Badge>total {q.total_ms} ms</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            pg_stat_statements indisponível ou sem dados suficientes.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
