import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

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

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("deals").select("*").order("updated_at", { ascending: false });
    if (error) {
      logger.error("fetchDeals", error);
      toast.error("Erro ao carregar oportunidades");
    } else {
      setDeals((data ?? []) as Deal[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  useEffect(() => {
    const ch = supabase.channel("deals-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "deals" }, () => fetchDeals())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchDeals]);

  const createDeal = useCallback(async (payload: Partial<Deal>) => {
    const { error } = await supabase.from("deals").insert(payload as never);
    if (error) { toast.error("Erro ao criar oportunidade"); logger.error(error); return false; }
    toast.success("Oportunidade criada");
    return true;
  }, []);

  const updateDeal = useCallback(async (id: string, patch: Partial<Deal>) => {
    const { error } = await supabase.from("deals").update(patch as never).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); logger.error(error); return false; }
    return true;
  }, []);

  const updateStage = useCallback(async (id: string, stage: string) => {
    return updateDeal(id, { stage });
  }, [updateDeal]);

  const computeHealth = useCallback(async (dealId: string) => {
    const { data, error } = await supabase.functions.invoke("compute-deal-health", { body: { dealId } });
    if (error) { toast.error("Erro ao calcular health"); logger.error(error); return null; }
    toast.success(`Health score atualizado: ${data?.healthScore ?? "?"}`);
    return data;
  }, []);

  return { deals, loading, refresh: fetchDeals, createDeal, updateDeal, updateStage, computeHealth };
}
