CREATE OR REPLACE FUNCTION public.get_agent_financial_leaderboard(p_days integer DEFAULT 30)
 RETURNS TABLE(agent_name text, total_calls bigint, total_seconds bigint, estimated_cost_cents bigint, revenue_cents numeric, deals_won bigint, profit_cents numeric, cac_cents numeric, roi_percent numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;
  IF NOT public.is_admin_or_supervisor() THEN
    RAISE EXCEPTION 'admin_or_supervisor_only';
  END IF;

  RETURN QUERY
  WITH calls AS (
    SELECT
      COALESCE(cs.agent_name, 'sem-agente') AS agent_name,
      COUNT(*) AS total_calls,
      COALESCE(SUM(cs.duration_seconds), 0)::bigint AS total_seconds,
      COALESCE(SUM(cs.duration_seconds * 15 / 60), 0)::bigint AS estimated_cost_cents
    FROM public.call_sessions cs
    WHERE cs.started_at > now() - (p_days || ' days')::interval
    GROUP BY 1
  ),
  revenue AS (
    SELECT
      COALESCE(d.owner_agent_name, 'sem-agente') AS agent_name,
      COALESCE(SUM(d.value_cents), 0)::numeric AS revenue_cents,
      COUNT(*)::bigint AS deals_won
    FROM public.deals d
    WHERE d.status = 'won' AND d.updated_at > now() - (p_days || ' days')::interval
    GROUP BY 1
  )
  SELECT
    COALESCE(c.agent_name, r.agent_name),
    COALESCE(c.total_calls, 0),
    COALESCE(c.total_seconds, 0),
    COALESCE(c.estimated_cost_cents, 0),
    COALESCE(r.revenue_cents, 0),
    COALESCE(r.deals_won, 0),
    COALESCE(r.revenue_cents, 0) - COALESCE(c.estimated_cost_cents, 0)::numeric,
    CASE WHEN COALESCE(r.deals_won,0) > 0
      THEN ROUND(COALESCE(c.estimated_cost_cents,0)::numeric / r.deals_won, 0)
      ELSE 0 END,
    CASE WHEN COALESCE(c.estimated_cost_cents,0) > 0
      THEN ROUND(((COALESCE(r.revenue_cents,0) - c.estimated_cost_cents::numeric) / c.estimated_cost_cents::numeric) * 100, 1)
      ELSE 0 END
  FROM calls c
  FULL JOIN revenue r ON r.agent_name = c.agent_name
  ORDER BY 5 DESC NULLS LAST;
END;
$function$
