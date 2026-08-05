
-- 1) Fix SECURITY DEFINER view -> security_invoker
ALTER VIEW public.financial_impact_daily SET (security_invoker = true);

-- 2) Revoke EXECUTE from anon on SECURITY DEFINER functions that require auth.
--    Keep anon access ONLY on pre-auth helpers used during login flow.
DO $$
DECLARE
  r RECORD;
  keep_anon TEXT[] := ARRAY[
    'check_login_lockout',
    'record_failed_login',
    'record_successful_login',
    'check_ip_in_cidr'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    IF NOT (r.proname = ANY(keep_anon)) THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, PUBLIC', r.sig);
    END IF;
  END LOOP;
END $$;

-- 3) Set stable search_path on any SECURITY DEFINER function missing it.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND (p.proconfig IS NULL OR NOT (p.proconfig::text LIKE '%search_path=%'))
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.sig);
  END LOOP;
END $$;
