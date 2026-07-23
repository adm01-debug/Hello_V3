import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import type { BloatRow } from "./types";

interface Props {
  isLoading: boolean;
  bloat?: BloatRow[];
}

export function BloatCard({ isLoading, bloat }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          Hotspots de Bloat
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : bloat?.length ? (
          <div className="space-y-2">
            {bloat.map((b) => (
              <div
                key={b.relname}
                className="flex items-center justify-between p-3 rounded-md border bg-card/50"
              >
                <div>
                  <div className="font-mono text-sm">{b.relname}</div>
                  <div className="text-xs text-muted-foreground">
                    {b.dead_tuples.toLocaleString()} dead / {b.live_tuples.toLocaleString()} live
                  </div>
                </div>
                <Badge variant="destructive">{b.dead_ratio}%</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum hotspot detectado. Todas as tabelas com bloat aceitável.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
