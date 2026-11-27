begin;
do $$
declare
  v_cols text;
  v_trg text;
  v_holds bigint;
  v_sessoes bigint;
  v_holds_nome bigint;
begin
  select string_agg(column_name, ', ' order by ordinal_position) into v_cols
    from information_schema.columns
   where table_schema = 'public' and table_name = 'call_sessions'
     and column_name in ('hold_time_seconds', 'wait_time_seconds', 'agent_name');

  select string_agg(t.tgname || ' on ' || c.relname, ' ; ') into v_trg
    from pg_trigger t join pg_class c on c.oid = t.tgrelid
   where not t.tgisinternal and c.relname in ('hold_events', 'call_sessions');

  select count(*) into v_holds from public.hold_events;
  select count(*) into v_holds_nome from public.hold_events where agent_name is not null;
  select count(*) into v_sessoes from public.call_sessions where coalesce(hold_time_seconds, 0) > 0;

  raise notice 'DIAG SESSOES COLS: %', v_cols;
  raise notice 'DIAG TRIGGERS: %', v_trg;
  raise notice 'DIAG HOLDS: % (com agent_name: %)', v_holds, v_holds_nome;
  raise notice 'DIAG SESSOES COM hold_time>0: %', v_sessoes;
end $$;
rollback;