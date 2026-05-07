-- Revoke execute from public on all functions in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;

-- Revoke from public on existing functions
DO $$ 
DECLARE 
    func_name text;
BEGIN 
    FOR func_name IN 
        SELECT quote_ident(proname) || '(' || pg_get_function_identity_arguments(p.oid) || ')'
        FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE n.nspname = 'public'
    LOOP 
        EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || func_name || ' FROM PUBLIC';
        EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || func_name || ' FROM anon';
        EXECUTE 'GRANT EXECUTE ON FUNCTION ' || func_name || ' TO authenticated';
        EXECUTE 'GRANT EXECUTE ON FUNCTION ' || func_name || ' TO service_role';
    END LOOP; 
END $$;
