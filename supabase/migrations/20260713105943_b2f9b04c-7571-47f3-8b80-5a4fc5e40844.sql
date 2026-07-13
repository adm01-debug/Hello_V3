
CREATE OR REPLACE FUNCTION public.get_agent_financial_leaderboard(p_days integer DEFAULT 30)
RETURNS TABLE(
  agent_name text,
  total_calls bigint,
  total_seconds bigint,
  estimated_cost_cents bigint,
  revenue_cents numeric,
  deals_won bigint,
  profit_cents numeric,
  cac_cents numeric,
  roi_percent numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
    COALESCE(c.agent_name, r.agent_name) AS agent_name,
    COALESCE(c.total_calls, 0) AS total_calls,
    COALESCE(c.total_seconds, 0) AS total_seconds,
    COALESCE(c.estimated_cost_cents, 0) AS estimated_cost_cents,
    COALESCE(r.revenue_cents, 0) AS revenue_cents,
    COALESCE(r.deals_won, 0) AS deals_won,
    COALESCE(r.revenue_cents, 0) - COALESCE(c.estimated_cost_cents, 0)::numeric AS profit_cents,
    CASE WHEN COALESCE(r.deals_won,0) > 0
      THEN ROUND(COALESCE(c.estimated_cost_cents,0)::numeric / r.deals_won, 0)
      ELSE 0 END AS cac_cents,
    CASE WHEN COALESCE(c.estimated_cost_cents,0) > 0
      THEN ROUND(((COALESCE(r.revenue_cents,0) - c.estimated_cost_cents::numeric) / c.estimated_cost_cents::numeric) * 100, 1)
      ELSE 0 END AS roi_percent
  FROM calls c
  FULL JOIN revenue r ON r.agent_name = c.agent_name
  ORDER BY revenue_cents DESC NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.get_agent_financial_leaderboard(integer) FROM public;
GRANT EXECUTE ON FUNCTION public.get_agent_financial_leaderboard(integer) TO authenticated, service_role;
