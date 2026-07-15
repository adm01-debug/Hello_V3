import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { AUTO_REFRESH_MS, type WebhookHealthRow } from "@/lib/webhook-health-utils";

const AUTO_REFRESH_KEY = "webhook-health:auto-refresh";

export function useWebhookHealthData() {
  const [rows, setRows] = useState<WebhookHealthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(AUTO_REFRESH_KEY) === "1";
  });
  const cancelRef = useRef(false);

  const loadRows = useCallback(async () => {
    setFetching(true);
    const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("webhook_flush_metrics")
      .select("created_at,sent,failed,oldest_age_ms,duration_ms,endpoint_hash")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(10000);
    if (cancelRef.current) return;
    if (error) {
      logger.error("webhook_health_load_failed", { error: error.message });
    } else {
      setRows((data ?? []) as WebhookHealthRow[]);
      setLastRefresh(new Date());
    }
    setLoading(false);
    setFetching(false);
  }, []);

  useEffect(() => {
    cancelRef.current = false;
    void loadRows();
    return () => {
      cancelRef.current = true;
    };
  }, [loadRows]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(AUTO_REFRESH_KEY, autoRefresh ? "1" : "0");
    if (!autoRefresh) return;
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void loadRows();
    };
    const id = window.setInterval(tick, AUTO_REFRESH_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void loadRows();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [autoRefresh, loadRows]);

  return { rows, loading, fetching, lastRefresh, autoRefresh, setAutoRefresh, loadRows };
}
