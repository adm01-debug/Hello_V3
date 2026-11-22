import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

export interface ScorecardTemplate {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface ScorecardCriterion {
  id: string;
  template_id: string;
  label: string;
  description: string | null;
  weight: number;
  max_score: number;
  display_order: number;
}

export interface CallScorecard {
  id: string;
  call_session_id: string;
  template_id: string;
  agent_name: string | null;
  total_score: number | null;
  max_total: number | null;
  status: "draft" | "submitted" | "approved";
  ai_generated: boolean;
  feedback: string | null;
  created_at: string;
}

export interface ScorecardResponse {
  id: string;
  scorecard_id: string;
  criterion_id: string;
  score: number;
  comment: string | null;
}

export function useScorecards(callSessionId?: string) {
  const [templates, setTemplates] = useState<ScorecardTemplate[]>([]);
  const [criteria, setCriteria] = useState<ScorecardCriterion[]>([]);
  const [scorecards, setScorecards] = useState<CallScorecard[]>([]);
  const [responses, setResponses] = useState<ScorecardResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [{ data: tpl }, { data: crit }] = await Promise.all([
      supabase.from("scorecard_templates").select("*").eq("is_active", true),
      supabase.from("scorecard_criteria").select("*").order("display_order"),
    ]);
    setTemplates((tpl ?? []) as ScorecardTemplate[]);
    setCriteria((crit ?? []) as ScorecardCriterion[]);

    if (callSessionId) {
      const { data: sc } = await supabase
        .from("call_scorecards").select("*").eq("call_session_id", callSessionId);
      setScorecards((sc ?? []) as CallScorecard[]);
      const ids = (sc ?? []).map((s) => s.id);
      if (ids.length) {
        const { data: r } = await supabase
          .from("scorecard_responses").select("*").in("scorecard_id", ids);
        setResponses((r ?? []) as ScorecardResponse[]);
      } else { setResponses([]); }
    }
    setLoading(false);
  }, [callSessionId]);

  useEffect(() => { refresh(); }, [refresh]);

  const updateStatus = useCallback(async (scorecardId: string, status: CallScorecard["status"]) => {
    const { error } = await supabase
      .from("call_scorecards").update({ status, updated_at: new Date().toISOString() })
      .eq("id", scorecardId);
    if (error) { toast.error("Erro ao atualizar a avaliação"); logger.error(error.message); return false; }
    toast.success(status === "approved" ? "Avaliação aprovada" : "Avaliação enviada");
    await refresh();
    return true;
  }, [refresh]);

  const createTemplate = useCallback(async (
    name: string,
    description: string | null,
    criteria: { label: string; description: string | null; weight: number; max_score: number }[],
  ) => {
    if (!name.trim() || criteria.length === 0) {
      toast.error("Informe o nome e ao menos um critério");
      return null;
    }
    const { data: tpl, error: tplErr } = await supabase
      .from("scorecard_templates")
      .insert({ name: name.trim(), description, is_active: true })
      .select("id").single();
    if (tplErr || !tpl) {
      toast.error("Erro ao criar o modelo");
      logger.error(tplErr?.message ?? "template insert failed");
      return null;
    }
    const { error: critErr } = await supabase.from("scorecard_criteria").insert(
      criteria.map((c, i) => ({
        template_id: tpl.id,
        label: c.label,
        description: c.description,
        weight: c.weight,
        max_score: c.max_score,
        display_order: i,
      })),
    );
    if (critErr) {
      toast.error("Modelo criado, mas os critérios falharam");
      logger.error(critErr.message);
      await refresh();
      return null;
    }
    toast.success("Modelo de avaliação criado");
    await refresh();
    return tpl.id as string;
  }, [refresh]);

  const generateAIScorecard = useCallback(async (templateId: string, overrideCallSessionId?: string) => {
    const sessionId = overrideCallSessionId ?? callSessionId;
    if (!sessionId) return null;
    const { data, error } = await supabase.functions.invoke("score-call", {
      body: { callSessionId: sessionId, templateId },
    });
    if (error) { toast.error("Erro ao gerar avaliação"); logger.error(error); return null; }
    toast.success("Avaliação gerada pela IA");
    refresh();
    return data;
  }, [callSessionId, refresh]);

  return { templates, criteria, scorecards, responses, loading, refresh, updateStatus, createTemplate, generateAIScorecard };
}
