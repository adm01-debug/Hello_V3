import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { traceHeaders, withTrace } from "@/lib/tracing";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type DealRow = Database["public"]["Tables"]["deals"]["Row"];
type DealInsert = Database["public"]["Tables"]["deals"]["Insert"];
type DealUpdate = Database["public"]["Tables"]["deals"]["Update"];

export interface Deal {
  id: string;
  name: string;
  contact_id: string | null;
  owner_agent_name: string | null;
  value_cents: number;
  currency: string;
  stage: string;
  probability: number;
  expected_close_date: string | null;
  health_score: number | null;
  health_factors: Record<string, number> | null;
  health_updated_at: string | null;
  status: string;
  notes: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export const DEAL_STAGES = [
  { id: "prospecting", label: "Prospecção" },
  { id: "qualification", label: "Qualificação" },
  { id: "proposal", label: "Proposta" },
  { id: "negotiation", label: "Negociação" },
  { id: "closed_won", label: "Ganha" },
  { id: "closed_lost", label: "Perdida" },
] as const;

const DEALS_PAGE_SIZE = 50;

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(0);

  // Paginas de 50 + desempate por id: o kanban nao pode receber o corte de 1000
  // linhas do PostgREST como se fosse o funil completo.
  const fetchPage = useCallback(async (pageToFetch: number) => {
    const from = pageToFetch * DEALS_PAGE_SIZE;
    const { data, error, count } = await supabase
      .from("deals")
      .select("*", pageToFetch === 0 ? { count: "exact" } : undefined)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + DEALS_PAGE_SIZE - 1);
    if (error) {
      logger.error("fetchDeals", error);
      toast.error("Erro ao carregar oportunidades");
      return;
    }
    const rows = ((data as DealRow[] | null) ?? []) as unknown as Deal[];
    if (pageToFetch === 0 && typeof count === "number") setTotalCount(count);
    setHasMore(rows.length === DEALS_PAGE_SIZE);
    setDeals((prev) => (pageToFetch === 0 ? rows : [...prev, ...rows]));
  }, []);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    pageRef.current = 0;
    try {
      await fetchPage(0);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      pageRef.current += 1;
      await fetchPage(pageRef.current);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loadingMore]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  useEffect(() => {
    const ch = supabase.channel("deals-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "deals" }, () => fetchDeals())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchDeals]);

  const createDeal = useCallback(async (payload: Partial<Deal>) => {
    const { error } = await supabase.from("deals").insert(payload as DealInsert);
    if (error) { toast.error("Erro ao criar oportunidade"); logger.error("createDeal", error); return false; }
    toast.success("Oportunidade criada");
    return true;
  }, []);

  const updateDeal = useCallback(async (id: string, patch: Partial<Deal>) => {
    // Lock otimista: sem enviar `version`, NEW.version fica igual a OLD.version e
    // o gatilho enforce_optimistic_lock nunca detecta a sobrescrita.
    const payload: Partial<Deal> = { ...patch };
    if (payload.version === undefined) {
      const current = deals.find((d) => d.id === id);
      if (current && typeof current.version === "number") payload.version = current.version;
    }
    const { error } = await supabase.from("deals").update(payload as DealUpdate).eq("id", id);
    if (error) {
      if (error.message?.includes("OPTIMISTIC_LOCK_CONFLICT")) {
        toast.error("Esta oportunidade foi alterada por outro usuário. Recarregando...");
        await fetchDeals();
        return false;
      }
      toast.error("Erro ao atualizar"); logger.error("updateDeal", error); return false;
    }
    return true;
  }, [deals, fetchDeals]);

  const updateStage = useCallback(async (id: string, stage: string) => {
    return updateDeal(id, { stage });
  }, [updateDeal]);

  const computeHealth = useCallback(async (dealId: string) => {
    return await withTrace("deal.health.compute", async () => {
      const { data, error } = await supabase.functions.invoke("compute-deal-health", {
        body: { dealId },
        headers: traceHeaders(),
      });
      if (error) { toast.error("Erro ao calcular health"); logger.error("computeHealth", error); return null; }
      toast.success(`Health score atualizado: ${data?.healthScore ?? "?"}`);
      return data;
    });
  }, []);

  return {
    deals, loading, totalCount, hasMore, loadingMore, loadMore,
    refresh: fetchDeals, createDeal, updateDeal, updateStage, computeHealth,
  };
}
