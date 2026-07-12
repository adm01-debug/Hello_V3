
-- 1. Tabela de auditoria
CREATE TABLE public.index_drop_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  index_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  sql_generated TEXT NOT NULL,
  admin_id UUID,
  admin_email TEXT,
  action TEXT NOT NULL DEFAULT 'copy' CHECK (action IN ('copy','execute')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_index_drop_audit_created_at ON public.index_drop_audit (created_at DESC);

GRANT SELECT ON public.index_drop_audit TO authenticated;
GRANT ALL ON public.index_drop_audit TO service_role;

ALTER TABLE public.index_drop_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ler histórico de DROP INDEX"
  ON public.index_drop_audit
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Sem policy INSERT: escrita apenas via RPC SECURITY DEFINER

-- 2. RPC: registra intenção de DROP INDEX
CREATE OR REPLACE FUNCTION public.log_index_drop_copy(
  p_index_name TEXT,
  p_table_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_email TEXT;
  v_sql TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin_only';
  END IF;

  SELECT email INTO v_email FROM public.user_profiles WHERE id = auth.uid();

  v_sql := format(
    'DROP INDEX CONCURRENTLY IF EXISTS public.%I;',
    p_index_name
  );

  INSERT INTO public.index_drop_audit (
    index_name, table_name, sql_generated, admin_id, admin_email, action
  ) VALUES (
    p_index_name, p_table_name, v_sql, auth.uid(), v_email, 'copy'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_index_drop_copy(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_index_drop_copy(TEXT, TEXT) TO authenticated;

-- 3. Reset trimestral de estatísticas de índices públicos
CREATE OR REPLACE FUNCTION public.reset_public_index_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_error TEXT;
BEGIN
  BEGIN
    SELECT COUNT(*) INTO v_count
    FROM (
      SELECT pg_stat_reset_single_table_counters(c.oid)
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'i'
    ) t;
  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;
    RETURN jsonb_build_object('ok', false, 'error', v_error, 'ran_at', now());
  END;

  RETURN jsonb_build_object('ok', true, 'reset_count', v_count, 'ran_at', now());
END;
$$;

-- 4. Cron trimestral: 1º dia de jan/abr/jul/out às 06:00 UTC
DO $$
BEGIN
  PERFORM cron.unschedule('quarterly-reset-index-stats');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'quarterly-reset-index-stats',
  '0 6 1 1,4,7,10 *',
  $$ SELECT public.reset_public_index_stats(); $$
);
