import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface ForecastData {
  period: "week" | "month" | "quarter";
  horizon: string;
  total_deals: number;
  total_pipeline_cents: number;
  weighted_forecast_cents: number;
  best_case_cents: number;
  commit_cents: number;
  confidence: number;
  by_stage: Record<string, { count: number; value: number }>;
}

export function useDealForecast(period: "week" | "month" | "quarter" = "month") {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: resp, error } = await supabase.functions.invoke("forecast-deals", { body: { period } });
    if (error) { logger.error("forecast-deals", error); }
    else setData(resp as ForecastData);
    setLoading(false);
  }, [period]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, refresh };
}
