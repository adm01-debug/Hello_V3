import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

export interface Cadence {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  version?: number;
  created_at: string;
  updated_at: string;
}

export interface CadenceStep {
  id: string;
  cadence_id: string;
  step_order: number;
  step_type: "call" | "whatsapp" | "task" | "email";
  delay_days: number;
  delay_hours: number;
  subject: string | null;
  body: string | null;
}

export interface CadenceEnrollment {
  id: string;
  cadence_id: string;
  contact_id: string | null;
  deal_id: string | null;
  agent_name: string | null;
  current_step: number;
  status: "active" | "paused" | "completed" | "cancelled";
  next_action_at: string | null;
  paused_reason: string | null;
}

const CADENCES_PAGE_SIZE = 50;

export function useCadences() {
  const [cadences, setCadences] = useState<Cadence[]>([]);
  const [steps, setSteps] = useState<CadenceStep[]>([]);
  const [loading, setLoading] = useState(true);

  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(0);
  const loadedIdsRef = useRef<string[]>([]);

  // Os passos passam a ser buscados so das cadencias carregadas (.in), o que
  // limita a segunda consulta em vez de trazer a tabela inteira a cada pagina.
  const fetchPage = useCallback(async (pageToFetch: number) => {
    const from = pageToFetch * CADENCES_PAGE_SIZE;
    const { data: cs, error: csError, count } = await supabase
      .from("cadences")
      .select("*", pageToFetch === 0 ? { count: "exact" } : undefined)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + CADENCES_PAGE_SIZE - 1);
    if (csError) logger.error("useCadences", csError);

    const rows = (cs ?? []) as Cadence[];
    const rowsIds = rows.map((c) => c.id);
    const ids = pageToFetch === 0 ? rowsIds : [...loadedIdsRef.current, ...rowsIds];
    loadedIdsRef.current = ids;
    if (pageToFetch === 0 && typeof count === "number") setTotalCount(count);
    setHasMore(rows.length === CADENCES_PAGE_SIZE);
    setCadences((prev) => (pageToFetch === 0 ? rows : [...prev, ...rows]));

    if (!ids.length) {
      setSteps([]);
      return;
    }
    const { data: st, error: stError } = await supabase
      .from("cadence_steps")
      .select("*")
      .in("cadence_id", ids)
      .order("step_order");
    if (stError) logger.error("useCadences steps", stError);
    else setSteps((st ?? []) as CadenceStep[]);
  }, []);

  const refresh = useCallback(async () => {
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

  useEffect(() => { refresh(); }, [refresh]);

  const createCadence = useCallback(async (name: string, description?: string) => {
    const { data, error } = await supabase.from("cadences")
      .insert({ name, description }).select().single();
    if (error) { toast.error("Erro ao criar cadência"); logger.error("createCadence", error); return null; }
    toast.success("Cadência criada");
    refresh();
    return data;
  }, [refresh]);

  const addStep = useCallback(async (step: Omit<CadenceStep, "id">) => {
    const { error } = await supabase.from("cadence_steps").insert(step as never);
    if (error) { toast.error("Erro ao adicionar etapa"); return false; }
    refresh();
    return true;
  }, [refresh]);

  const enrollContact = useCallback(async (cadenceId: string, contactId: string, agentName?: string) => {
    const { error } = await supabase.from("cadence_enrollments").insert({
      cadence_id: cadenceId,
      contact_id: contactId,
      agent_name: agentName ?? null,
      status: "active",
      next_action_at: new Date().toISOString(),
    } as never);
    if (error) { toast.error("Erro ao inscrever contato"); return false; }
    toast.success("Contato inscrito na cadência");
    return true;
  }, []);

  const updateCadence = useCallback(async (
    id: string,
    patch: { name?: string; description?: string | null; is_active?: boolean },
  ) => {
    const payload: Record<string, unknown> = { ...patch };
    const current = cadences.find((c) => c.id === id);
    if (typeof current?.version === "number") payload.version = current.version;
    const { error } = await supabase.from("cadences").update(payload as never).eq("id", id);
    if (error) {
      if (error.message?.includes("OPTIMISTIC_LOCK_CONFLICT")) {
        toast.error("Esta cadência foi alterada por outro usuário. Recarregando...");
        await refresh();
        return false;
      }
      toast.error("Erro ao atualizar cadência");
      logger.error("updateCadence", error);
      return false;
    }
    toast.success("Cadência atualizada");
    await refresh();
    return true;
  }, [cadences, refresh]);

  const deleteCadence = useCallback(async (id: string) => {
    const { error } = await supabase.from("cadences").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir cadência");
      logger.error("deleteCadence", error);
      return false;
    }
    toast.success("Cadência excluída");
    await refresh();
    return true;
  }, [refresh]);

  const updateStep = useCallback(async (
    id: string,
    patch: Partial<Omit<CadenceStep, "id" | "cadence_id">>,
  ) => {
    const { error } = await supabase.from("cadence_steps").update(patch as never).eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar etapa");
      logger.error("updateStep", error);
      return false;
    }
    toast.success("Etapa atualizada");
    await refresh();
    return true;
  }, [refresh]);

  // Excluir abre buraco na ordem dos passos (1,2,3 -> 1,3); renumera para o
  // executor percorrer a sequencia sem saltos.
  const deleteStep = useCallback(async (id: string) => {
    const target = steps.find((s) => s.id === id);
    const { error } = await supabase.from("cadence_steps").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir etapa");
      logger.error("deleteStep", error);
      return false;
    }
    if (target) {
      const remaining = steps
        .filter((s) => s.cadence_id === target.cadence_id && s.id !== id)
        .sort((a, b) => a.step_order - b.step_order);
      for (let i = 0; i < remaining.length; i += 1) {
        if (remaining[i].step_order !== i + 1) {
          const { error: renumberError } = await supabase
            .from("cadence_steps")
            .update({ step_order: i + 1 } as never)
            .eq("id", remaining[i].id);
          if (renumberError) logger.error("deleteStep renumber", renumberError);
        }
      }
    }
    toast.success("Etapa excluída");
    await refresh();
    return true;
  }, [steps, refresh]);

  return {
    cadences, steps, loading, totalCount, hasMore, loadingMore, loadMore,
    refresh, createCadence, addStep, enrollContact,
    updateCadence, deleteCadence, updateStep, deleteStep,
  };
}

export function useCadenceEnrollments(agentName?: string) {
  const [enrollments, setEnrollments] = useState<CadenceEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnrollments = useCallback(() => {
    let q = supabase.from("cadence_enrollments").select("*").order("next_action_at", { ascending: true });
    if (agentName) q = q.eq("agent_name", agentName);
    return q.then(({ data, error }) => {
      if (error) logger.error("useCadenceEnrollments", error);
      else setEnrollments((data ?? []) as CadenceEnrollment[]);
      setLoading(false);
    });
  }, [agentName]);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  const updateEnrollmentStatus = useCallback(async (
    id: string,
    status: CadenceEnrollment["status"],
  ) => {
    const patch: Record<string, unknown> = { status };
    // Retomar limpa o motivo gravado pelo motor: a inscricao volta a andar.
    if (status === "active") patch.paused_reason = null;
    const { error } = await supabase.from("cadence_enrollments").update(patch as never).eq("id", id);
    if (error) { toast.error("Erro ao atualizar inscrição"); return false; }
    fetchEnrollments();
    return true;
  }, [fetchEnrollments]);

  return { enrollments, loading, refresh: fetchEnrollments, updateEnrollmentStatus };
}
