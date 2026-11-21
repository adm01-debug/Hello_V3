# Views


## public.financial_impact_daily (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
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

## public.index_usage (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | pg_catalog.pg_stat_user_indexes |
| populada | n/a |
| comentário |  |


```sql
SELECT schemaname,
    relname AS tablename,
    indexrelname AS indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid::regclass)) AS index_size
   FROM pg_stat_user_indexes
  ORDER BY idx_scan DESC;
```

## public.migration_status (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | public.migration_rollbacks, public.schema_migrations |
| populada | n/a |
| comentário |  |


```sql
SELECT sm.version,
    sm.name,
    sm.applied_at,
    sm.applied_by,
    sm.execution_time_ms,
    sm.success,
        CASE
            WHEN mr.id IS NOT NULL THEN 'Rolled Back'::text
            ELSE 'Applied'::text
        END AS status
   FROM schema_migrations sm
     LEFT JOIN migration_rollbacks mr ON sm.version::text = mr.version::text
  ORDER BY sm.version DESC;
```

## public.unused_indexes (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | pg_catalog.pg_stat_user_indexes |
| populada | n/a |
| comentário |  |


```sql
SELECT schemaname,
    relname AS tablename,
    indexrelname AS indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid::regclass)) AS index_size
   FROM pg_stat_user_indexes
  WHERE idx_scan = 0 AND indexrelname !~~ 'pk_%'::text AND indexrelname !~~ '%_pkey'::text
  ORDER BY (pg_relation_size(indexrelid::regclass)) DESC;
```
