import { useCallback, useEffect, useState } from "react";
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

export function useCadences() {
  const [cadences, setCadences] = useState<Cadence[]>([]);
  const [steps, setSteps] = useState<CadenceStep[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [{ data: cs }, { data: st }] = await Promise.all([
      supabase.from("cadences").select("*").order("created_at", { ascending: false }),
      supabase.from("cadence_steps").select("*").order("step_order"),
    ]);
    setCadences((cs ?? []) as Cadence[]);
    setSteps((st ?? []) as CadenceStep[]);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const createCadence = useCallback(async (name: string, description?: string) => {
    const { data, error } = await supabase.from("cadences")
      .insert({ name, description }).select().single();
    if (error) { toast.error("Erro ao criar cadência"); logger.error(error); return null; }
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

  return { cadences, steps, loading, refresh, createCadence, addStep, enrollContact };
}

export function useCadenceEnrollments(agentName?: string) {
  const [enrollments, setEnrollments] = useState<CadenceEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = supabase.from("cadence_enrollments").select("*").order("next_action_at", { ascending: true });
    if (agentName) q = q.eq("agent_name", agentName);
    q.then(({ data, error }) => {
      if (error) logger.error(error);
      else setEnrollments((data ?? []) as CadenceEnrollment[]);
      setLoading(false);
    });
  }, [agentName]);

  return { enrollments, loading };
}
