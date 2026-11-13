# Views


## public.financial_impact_daily (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | public.call_sessions, public.deals |
| populada | n/a |
| comentário |  |


```sql
WITH calls_daily AS (
         SELECT date_trunc('day'::text, call_sessions.started_at)::date AS day,
            count(*) AS total_calls,
            COALESCE(sum(call_sessions.duration_seconds), 0::bigint) AS total_seconds,
            COALESCE(sum(call_sessions.duration_seconds * 15 / 60), 0::bigint) AS estimated_cost_cents
           FROM call_sessions
          WHERE call_sessions.started_at > (now() - '90 days'::interval)
          GROUP BY (date_trunc('day'::text, call_sessions.started_at)::date)
        ), revenue_daily AS (
         SELECT date_trunc('day'::text, deals.updated_at)::date AS day,
            COALESCE(sum(deals.value_cents), 0::numeric) AS revenue_cents,
            count(*) AS deals_won
           FROM deals
          WHERE deals.status = 'won'::text AND deals.updated_at > (now() - '90 days'::interval)
          GROUP BY (date_trunc('day'::text, deals.updated_at)::date)
        )
 SELECT COALESCE(c.day, r.day) AS day,
    COALESCE(c.total_calls, 0::bigint) AS total_calls,
    COALESCE(c.total_seconds, 0::bigint) AS total_seconds,
    COALESCE(c.estimated_cost_cents, 0::bigint) AS estimated_cost_cents,
    COALESCE(r.revenue_cents, 0::numeric) AS revenue_cents,
    COALESCE(r.deals_won, 0::bigint) AS deals_won,
    COALESCE(r.revenue_cents, 0::numeric) - COALESCE(c.estimated_cost_cents, 0::bigint)::numeric AS profit_cents
   FROM calls_daily c
     FULL JOIN revenue_daily r ON c.day = r.day
  ORDER BY (COALESCE(c.day, r.day)) DESC;
```
