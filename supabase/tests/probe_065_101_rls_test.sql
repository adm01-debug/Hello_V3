-- Sonda de leitura (etapas 065 e 101): estado real de call_sessions/call_summaries/hold_events
-- e volatilidade dos helpers de papel.
begin;

do $$
declare r record;
begin
  select count(*) as total,
         count(*) filter (where created_at > now() - interval '1 hour') as h1,
         count(*) filter (where created_at > now() - interval '1 day') as d1,
         count(*) filter (where created_at > now() - interval '7 days') as d7,
         count(*) filter (where created_at > now() - interval '30 days') as d30,
         min(created_at) as primeiro,
         max(created_at) as ultimo
    into r from public.call_sessions;
  raise notice 'PROBE call_sessions total=% 1h=% 1d=% 7d=% 30d=% primeiro=% ultimo=%',
    r.total, r.h1, r.d1, r.d7, r.d30, r.primeiro, r.ultimo;
end $$;

do $$
declare r record;
begin
  for r in select coalesce(status, '(nulo)') as status, count(*) as n, max(created_at) as ultimo
             from public.call_sessions
            where created_at > now() - interval '7 days'
            group by 1 order by 2 desc loop
    raise notice 'PROBE call_sessions 7d status=% n=% ultimo=%', r.status, r.n, r.ultimo;
  end loop;
end $$;

do $$
declare r record;
begin
  select count(*) filter (where agent_name is not null) as com_agente,
         count(*) filter (where agent_name is null) as sem_agente,
         count(*) filter (where duration_seconds is not null) as com_duracao
    into r from public.call_sessions where created_at > now() - interval '7 days';
  raise notice 'PROBE call_sessions 7d com_agent_name=% sem_agent_name=% com_duracao=%', r.com_agente, r.sem_agente, r.com_duracao;
end $$;

do $$
declare r record;
begin
  if to_regclass('public.call_summaries') is null then
    raise notice 'PROBE call_summaries: tabela nao existe';
    return;
  end if;
  select count(*) as total,
         count(*) filter (where created_at > now() - interval '1 hour') as h1,
         count(*) filter (where created_at > now() - interval '1 day') as d1,
         max(created_at) as ultimo
    into r from public.call_summaries;
  raise notice 'PROBE call_summaries total=% 1h=% 1d=% ultimo=%', r.total, r.h1, r.d1, r.ultimo;
end $$;

do $$
declare r record;
begin
  select count(*) as total,
         count(*) filter (where call_session_id is null) as sem_chamada,
         count(*) filter (where ended_at is null) as sem_fim,
         max(started_at) as ultimo
    into r from public.hold_events;
  raise notice 'PROBE hold_events total=% sem_call_session_id=% sem_ended_at=% ultimo=%', r.total, r.sem_chamada, r.sem_fim, r.ultimo;
end $$;

do $$
declare r record;
begin
  for r in select p.proname, p.provolatile::text as vol, p.prosecdef::text as secdef,
                   pg_get_function_identity_arguments(p.oid) as args
             from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public'
              and p.proname in ('is_admin', 'is_supervisor', 'is_admin_or_supervisor', 'get_auth_agent_id',
                                'is_admin_user', 'get_user_role', 'has_role', 'get_user_agent_name')
            order by p.proname loop
    raise notice 'PROBE fn public.% (%) volatile=% secdef=%', r.proname, r.args, r.vol, r.secdef;
  end loop;
end $$;

do $$
declare r record;
begin
  for r in select pol.schemaname, pol.policyname, pol.roles::text as roles,
                   case
                     when coalesce(pol.qual,'') like '%is_admin_or_supervisor%' or coalesce(pol.with_check,'') like '%is_admin_or_supervisor%' then 'is_admin_or_supervisor'
                     when coalesce(pol.qual,'') like '%is_admin()%' or coalesce(pol.with_check,'') like '%is_admin()%' then 'is_admin'
                     when coalesce(pol.qual,'') like '%is_supervisor%' or coalesce(pol.with_check,'') like '%is_supervisor%' then 'is_supervisor'
                     when coalesce(pol.qual,'') like '%get_auth_agent_id%' or coalesce(pol.with_check,'') like '%get_auth_agent_id%' then 'get_auth_agent_id'
                     else '(outro)' end as helper
             from pg_policies pol
            where coalesce(pol.qual,'') ~ '(is_admin_or_supervisor|is_admin\(\)|is_supervisor|get_auth_agent_id)'
               or coalesce(pol.with_check,'') ~ '(is_admin_or_supervisor|is_admin\(\)|is_supervisor|get_auth_agent_id)' loop
    raise notice 'PROBE policy %.% roles=% helper=%', r.schemaname, r.policyname, r.roles, r.helper;
  end loop;
end $$;

do $$
declare r record;
begin
  for r in select vol, count(*) as n from (
             select case
                      when coalesce(pol.qual,'') ~ '(is_admin_or_supervisor|is_admin\(\)|is_supervisor|get_auth_agent_id)'
                        or coalesce(pol.with_check,'') ~ '(is_admin_or_supervisor|is_admin\(\)|is_supervisor|get_auth_agent_id)'
                      then 'usa-helper' else 'sem-helper' end as vol
               from pg_policies pol) t
            group by 1 order by 1 loop
    raise notice 'PROBE policies com/sem os 4 helpers: % = %', r.vol, r.n;
  end loop;
end $$;

rollback;