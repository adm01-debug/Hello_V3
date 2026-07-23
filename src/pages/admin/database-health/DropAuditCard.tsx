import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { History } from "lucide-react";
import type { IndexDropAuditRow } from "./types";

interface Props {
  isLoading: boolean;
  rows?: IndexDropAuditRow[];
}

export function DropAuditCard({ isLoading, rows }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Histórico de manutenção de índices (últimas 20)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : rows && rows.length > 0 ? (
          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between p-2 rounded-md border bg-card/50 gap-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-mono truncate">{row.index_name}</div>
                  <div className="text-xs text-muted-foreground">
                    em <span className="font-mono">{row.table_name}</span> • {row.admin_email ?? "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={row.action === "execute" ? "destructive" : "outline"}>
                    {row.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma cópia de DROP INDEX registrada ainda.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
