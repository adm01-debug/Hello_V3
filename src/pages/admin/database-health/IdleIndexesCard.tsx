import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { IdleIndex } from "./types";

interface Props {
  isLoading: boolean;
  indexes?: IdleIndex[];
  onAudited: () => void;
}

export function IdleIndexesCard({ isLoading, indexes, onAudited }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-warning" />
          Índices ociosos (idx_scan = 0, &gt; 1MB)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : indexes && indexes.length > 0 ? (
          <div className="space-y-2">
            {indexes.map((i) => {
              const sql = `DROP INDEX CONCURRENTLY IF EXISTS ${i.schemaname}.${i.indexrelname};`;
              return (
                <div
                  key={i.indexrelname}
                  className="flex items-center justify-between p-3 rounded-md border bg-card/50 gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-sm truncate">{i.indexrelname}</div>
                    <div className="text-xs text-muted-foreground">
                      em <span className="font-mono">{i.relname}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline">{i.index_size_pretty}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(sql);
                          toast.success("DROP INDEX copiado para a área de transferência");
                          void supabase
                            .rpc("log_index_drop_copy", {
                              p_index_name: i.indexrelname,
                              p_table_name: i.relname,
                            })
                            .then(() => onAudited());
                        } catch {
                          toast.error("Falha ao copiar SQL");
                        }
                      }}
                      title={sql}
                    >
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      DROP
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum índice ocioso relevante. Todos os índices estão sendo utilizados.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
