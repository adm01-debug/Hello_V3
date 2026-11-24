import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

export interface Cadence {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
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

  return {
    cadences, steps, loading, totalCount, hasMore, loadingMore, loadMore,
    refresh, createCadence, addStep, enrollContact,
  };
}

export function useCadenceEnrollments(agentName?: string) {
  const [enrollments, setEnrollments] = useState<CadenceEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = supabase.from("cadence_enrollments").select("*").order("next_action_at", { ascending: true });
    if (agentName) q = q.eq("agent_name", agentName);
    q.then(({ data, error }) => {
      if (error) logger.error("useCadenceEnrollments", error);
      else setEnrollments((data ?? []) as CadenceEnrollment[]);
      setLoading(false);
    });
  }, [agentName]);

  return { enrollments, loading };
}
