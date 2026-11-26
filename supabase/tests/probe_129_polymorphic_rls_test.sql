-- Sonda da etapa 129: valores reais dos ponteiros polimorficos.
begin;
do $$
declare r record;
begin
  for r in select coalesce(resource_type, '(nulo)') as tipo, count(*) as n
             from public.audit_logs group by 1 order by 2 desc loop
    raise notice 'PROBE audit_logs.resource_type=% n=%', r.tipo, r.n;
  end loop;
end $$;
do $$
declare r record;
begin
  for r in select coalesce(source_type, '(nulo)') as tipo, count(*) as n
             from public.notifications group by 1 order by 2 desc loop
    raise notice 'PROBE notifications.source_type=% n=%', r.tipo, r.n;
  end loop;
end $$;
do $$
declare r record;
begin
  if to_regclass('public.optimistic_lock_conflicts') is null then
    raise notice 'PROBE optimistic_lock_conflicts: tabela ausente';
    return;
  end if;
  for r in select column_name from information_schema.columns
            where table_schema='public' and table_name='optimistic_lock_conflicts' order by ordinal_position loop
    raise notice 'PROBE coluna optimistic_lock_conflicts.%', r.column_name;
  end loop;
  for r in select coalesce(table_name, '(nulo)') as t, count(*) as n
             from public.optimistic_lock_conflicts group by 1 order by 2 desc loop
    raise notice 'PROBE optimistic_lock_conflicts.table_name=% n=%', r.t, r.n;
  end loop;
end $$;
do $$
declare r record;
begin
  for r in select c.relname as tabela, a.attname as coluna, col_description(c.oid, a.attnum) as comentario
             from pg_class c join pg_namespace n on n.oid = c.relnamespace
             join pg_attribute a on a.attrelid = c.oid
            where n.nspname='public'
              and ((c.relname='audit_logs' and a.attname in ('resource_id','resource_type'))
                or (c.relname='notifications' and a.attname in ('source_id','source_type'))
                or (c.relname='optimistic_lock_conflicts' and a.attname in ('record_id','table_name')))
              and a.attnum > 0 loop
    raise notice 'PROBE comentario atual %.% = %', r.tabela, r.coluna, coalesce(r.comentario, '(nenhum)');
  end loop;
end $$;
rollback;