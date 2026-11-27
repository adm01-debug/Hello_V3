begin;
do $$
declare
  v_cols text;
  v_pol text;
  v_checks text;
  v_total bigint;
begin
  select string_agg(column_name || ' ' || data_type, ', ' order by ordinal_position)
    into v_cols
    from information_schema.columns
   where table_schema = 'public' and table_name = 'call_control_audit_logs';

  select string_agg(policyname || ' [' || cmd || '] roles=' || array_to_string(roles, ',') ||
                    ' qual=' || coalesce(qual, '-') || ' check=' || coalesce(with_check, '-'), E'\n  ')
    into v_pol
    from pg_policies
   where schemaname = 'public' and tablename = 'call_control_audit_logs';

  select string_agg(conname || ' => ' || pg_get_constraintdef(oid), ' ; ')
    into v_checks
    from pg_constraint
   where conrelid = 'public.call_control_audit_logs'::regclass;

  execute 'select count(*) from public.call_control_audit_logs' into v_total;

  raise notice 'DIAG COLS: %', v_cols;
  raise notice 'DIAG POLICIES: %', v_pol;
  raise notice 'DIAG CONSTRAINTS: %', v_checks;
  raise notice 'DIAG ROWS: %', v_total;
end $$;
rollback;