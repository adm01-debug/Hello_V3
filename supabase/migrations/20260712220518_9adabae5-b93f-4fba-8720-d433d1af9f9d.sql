-- Composite index for notification debounce checks in triggers
-- Pattern: WHERE source_type = X AND source_id = Y AND created_at > now() - interval
CREATE INDEX IF NOT EXISTS idx_notifications_source_debounce
  ON public.notifications (source_type, source_id, created_at DESC)
  WHERE source_type IS NOT NULL;

-- Pattern for spike detection: WHERE source_type = X AND created_at > now() - interval
CREATE INDEX IF NOT EXISTS idx_notifications_source_type_time
  ON public.notifications (source_type, created_at DESC)
  WHERE source_type IS NOT NULL;

-- Speed up index_drop_audit trigger: WHERE admin_id = X AND created_at > now() - 24h
CREATE INDEX IF NOT EXISTS idx_index_drop_audit_admin_time
  ON public.index_drop_audit (admin_id, created_at DESC)
  WHERE admin_id IS NOT NULL;