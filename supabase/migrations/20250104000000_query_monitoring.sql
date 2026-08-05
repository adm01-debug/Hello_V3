CREATE INDEX idx_queries_duration ON pg_stat_statements(mean_time DESC);
CREATE INDEX idx_queries_calls ON pg_stat_statements(calls DESC);

CREATE OR REPLACE VIEW slow_queries AS
SELECT
  query,
  calls,
  total_time / 1000 AS total_seconds,
  mean_time / 1000 AS avg_seconds,
  max_time / 1000 AS max_seconds
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 50;
