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

  const generateAIScorecard = useCallback(async (templateId: string) => {
    if (!callSessionId) return null;
    const { data, error } = await supabase.functions.invoke("score-call", {
      body: { callSessionId, templateId },
    });
    if (error) { toast.error("Erro ao gerar avaliação"); logger.error(error); return null; }
    toast.success("Avaliação gerada pela IA");
    refresh();
    return data;
  }, [callSessionId, refresh]);

  return { templates, criteria, scorecards, responses, loading, refresh, generateAIScorecard };
}
