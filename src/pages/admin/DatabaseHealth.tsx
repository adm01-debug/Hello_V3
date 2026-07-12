import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, AlertTriangle, RefreshCw, Gauge, Trash2 } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

type BloatRow = {
  schemaname: string;
  relname: string;
  dead_tuples: number;
  live_tuples: number;
  dead_ratio: number;
};

type TopTable = {
  relname: string;
  total_bytes: number;
  heap_bytes: number;
  index_bytes: number;
  live_tuples: number | null;
  dead_tuples: number | null;
};

type SlowQuery = {
  query: string;
  calls: number;
  mean_ms: number;
  total_ms: number;
  max_ms: number;
};

type IdleIndex = {
  schemaname: string;
  relname: string;
  indexrelname: string;
  index_size_bytes: number;
  index_size_pretty: string;
};

interface Snapshot {
  generated_at: string;
  bloat: BloatRow[];
  top_tables: TopTable[];
  activity: {
    total_connections: number;
    active: number;
    idle: number;
    idle_in_txn: number;
  };
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

export default function DatabaseHealth() {
  usePageTitle("Saúde do Banco");

  const snapshot = useQuery({
    queryKey: ["db-health-snapshot"],
    queryFn: async (): Promise<Snapshot> => {
      const { data, error } = await supabase.rpc("get_database_health_snapshot");
      if (error) throw error;
      return data as unknown as Snapshot;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const slow = useQuery({
    queryKey: ["db-top-slow-queries"],
    queryFn: async (): Promise<SlowQuery[]> => {
      const { data, error } = await supabase.rpc("get_top_slow_queries", { p_limit: 15 });
      if (error) throw error;
      return (data as unknown as SlowQuery[]) ?? [];
    },
    staleTime: 60_000,
  });

  const idle = useQuery({
    queryKey: ["db-idle-indexes"],
    queryFn: async (): Promise<IdleIndex[]> => {
      const { data, error } = await supabase.rpc("check_idle_indexes");
      if (error) throw error;
      return (data as unknown as IdleIndex[]) ?? [];
    },
    staleTime: 60_000,
  });

  const refresh = () => {
    snapshot.refetch();
    slow.refetch();
    idle.refetch();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Saúde do Banco</h1>
            <p className="text-sm text-muted-foreground">
              Bloat, tamanhos, atividade e consultas mais lentas.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Atividade */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["total_connections", "active", "idle", "idle_in_txn"] as const).map((key) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase text-muted-foreground">
                {key.replace(/_/g, " ")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {snapshot.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {snapshot.data?.activity?.[key] ?? 0}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bloat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Hotspots de Bloat
          </CardTitle>
        </CardHeader>
        <CardContent>
          {snapshot.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : snapshot.data?.bloat?.length ? (
            <div className="space-y-2">
              {snapshot.data.bloat.map((b) => (
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

      {/* Top tabelas por tamanho */}
      <Card>
        <CardHeader>
          <CardTitle>Top 15 tabelas por tamanho</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshot.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground border-b">
                    <th className="py-2">Tabela</th>
                    <th className="py-2 text-right">Total</th>
                    <th className="py-2 text-right">Heap</th>
                    <th className="py-2 text-right">Índices</th>
                    <th className="py-2 text-right">Linhas</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.data?.top_tables?.map((t) => (
                    <tr key={t.relname} className="border-b border-border/40">
                      <td className="py-2 font-mono">{t.relname}</td>
                      <td className="py-2 text-right">{formatBytes(t.total_bytes)}</td>
                      <td className="py-2 text-right text-muted-foreground">
                        {formatBytes(t.heap_bytes)}
                      </td>
                      <td className="py-2 text-right text-muted-foreground">
                        {formatBytes(t.index_bytes)}
                      </td>
                      <td className="py-2 text-right">
                        {(t.live_tuples ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slow queries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" />
            Top 15 consultas mais lentas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {slow.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : slow.data && slow.data.length > 0 ? (
            <div className="space-y-2">
              {slow.data.map((q, i) => (
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

      {snapshot.data?.generated_at && (
        <p className="text-xs text-muted-foreground text-right">
          Gerado em {new Date(snapshot.data.generated_at).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}
