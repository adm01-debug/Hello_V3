
-- BRIN indexes on append-only time-series tables
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_brin ON public.audit_logs USING brin (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_brin ON public.performance_metrics USING brin (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS idx_call_quality_metrics_created_brin ON public.call_quality_metrics USING brin (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created_brin ON public.rate_limit_logs USING brin (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS idx_call_control_audit_logs_created_brin ON public.call_control_audit_logs USING brin (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_brin ON public.login_attempts USING brin (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS idx_rls_audit_logs_created_brin ON public.rls_audit_logs USING brin (created_at) WITH (pages_per_range = 32);
CREATE INDEX IF NOT EXISTS idx_geo_access_logs_created_brin ON public.geo_access_logs USING brin (created_at) WITH (pages_per_range = 32);

-- Partial indexes for hot filtered queries
CREATE INDEX IF NOT EXISTS idx_call_sessions_active_partial
  ON public.call_sessions (started_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_notifications_unread_user
  ON public.notifications (user_id, created_at DESC)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_voip_quality_alerts_unack
  ON public.voip_quality_alerts (user_id, created_at DESC)
  WHERE acknowledged_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_coaching_assignments_pending
  ON public.coaching_assignments (agent_name, created_at DESC)
  WHERE completed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_scheduled_callbacks_pending
  ON public.scheduled_callbacks (assigned_agent, scheduled_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_dialer_queue_pending
  ON public.dialer_queue (campaign_id, priority DESC, created_at)
  WHERE status = 'pending';

ANALYZE public.audit_logs;
ANALYZE public.performance_metrics;
ANALYZE public.call_quality_metrics;
ANALYZE public.rate_limit_logs;
ANALYZE public.call_sessions;
ANALYZE public.notifications;
ANALYZE public.voip_quality_alerts;
ANALYZE public.coaching_assignments;
ANALYZE public.scheduled_callbacks;
ANALYZE public.dialer_queue;
