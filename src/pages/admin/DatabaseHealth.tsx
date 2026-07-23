import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Database, RefreshCw, ShieldAlert } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import type {
  IdleIndex,
  IndexDropAuditRow,
  SlowQuery,
  Snapshot,
} from "./database-health/types";
import { ActivityCards } from "./database-health/ActivityCards";
import { BloatCard } from "./database-health/BloatCard";
import { TopTablesCard } from "./database-health/TopTablesCard";
import { IdleIndexesCard } from "./database-health/IdleIndexesCard";
import { DropAuditCard } from "./database-health/DropAuditCard";
import { SlowQueriesCard } from "./database-health/SlowQueriesCard";

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

  const dropAudit = useQuery({
    queryKey: ["db-index-drop-audit"],
    queryFn: async (): Promise<IndexDropAuditRow[]> => {
      const { data, error } = await supabase
        .from("index_drop_audit")
        .select("id, index_name, table_name, admin_email, action, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data as IndexDropAuditRow[]) ?? [];
    },
    staleTime: 60_000,
  });

  const refresh = () => {
    snapshot.refetch();
    slow.refetch();
    idle.refetch();
    dropAudit.refetch();
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
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/admin/security-alerts">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Alertas de segurança
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <ActivityCards isLoading={snapshot.isLoading} data={snapshot.data} />
      <BloatCard isLoading={snapshot.isLoading} bloat={snapshot.data?.bloat} />
      <TopTablesCard isLoading={snapshot.isLoading} tables={snapshot.data?.top_tables} />
      <IdleIndexesCard
        isLoading={idle.isLoading}
        indexes={idle.data}
        onAudited={() => dropAudit.refetch()}
      />
      <DropAuditCard isLoading={dropAudit.isLoading} rows={dropAudit.data} />
      <SlowQueriesCard isLoading={slow.isLoading} queries={slow.data} />

      {snapshot.data?.generated_at && (
        <p className="text-xs text-muted-foreground text-right">
          Gerado em {new Date(snapshot.data.generated_at).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}
