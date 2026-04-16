import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

export interface Tracker {
  id: string;
  name: string;
  category: string;
  description: string | null;
  keywords: string[];
  match_type: "any" | "all";
  is_active: boolean;
  color: string;
}

export interface TrackerMatch {
  id: string;
  tracker_id: string;
  call_session_id: string;
  agent_name: string | null;
  matched_keyword: string | null;
  quote: string;
  timestamp_seconds: number | null;
  created_at: string;
}

export function useTrackers() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("trackers").select("*").order("name");
    if (error) logger.error(error);
    else setTrackers((data ?? []) as Tracker[]);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const createTracker = useCallback(async (t: Omit<Tracker, "id">) => {
    const { error } = await supabase.from("trackers").insert(t as never);
    if (error) { toast.error("Erro ao criar tracker"); return false; }
    toast.success("Tracker criado");
    refresh();
    return true;
  }, [refresh]);

  const toggleTracker = useCallback(async (id: string, isActive: boolean) => {
    await supabase.from("trackers").update({ is_active: isActive }).eq("id", id);
    refresh();
  }, [refresh]);

  return { trackers, loading, refresh, createTracker, toggleTracker };
}

export function useTrackerMatches(filters?: { trackerId?: string; agentName?: string; days?: number }) {
  const [matches, setMatches] = useState<TrackerMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = supabase.from("tracker_matches").select("*").order("created_at", { ascending: false }).limit(500);
    if (filters?.trackerId) q = q.eq("tracker_id", filters.trackerId);
    if (filters?.agentName) q = q.eq("agent_name", filters.agentName);
    if (filters?.days) {
      const since = new Date(Date.now() - filters.days * 86400000).toISOString();
      q = q.gte("created_at", since);
    }
    q.then(({ data, error }) => {
      if (error) logger.error(error);
      else setMatches((data ?? []) as TrackerMatch[]);
      setLoading(false);
    });
  }, [filters?.trackerId, filters?.agentName, filters?.days]);

  return { matches, loading };
}
