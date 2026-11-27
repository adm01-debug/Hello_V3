begin;
do $$
declare
  v_hoje date;
  v_res jsonb;
  v_linhas text;
  v_total bigint;
  v_rec bigint;
begin
  select count(*) into v_total from public.holidays;
  select count(*) into v_rec from public.holidays where recurring;
  raise notice 'DIAG holidays total=% recurring=%', v_total, v_rec;

  select ((now() AT TIME ZONE coalesce((select timezone from public.calling_hours_config where region_code='BR' and is_active limit 1), 'America/Sao_Paulo')))::date into v_hoje;
  raise notice 'DIAG HOJE (BR): %', v_hoje;

  select string_agg(format('%s | %s | %s | nacional=%s | regiao=%s', h.id, h.date, h.name, h.is_national, coalesce(h.region_code,'-')), E'\n  ')
    into v_linhas
    from public.holidays h
   where (h.is_national = true or h.region_code = 'BR')
     and (h.date = v_hoje
          or (h.recurring and extract(month from h.date) = extract(month from v_hoje)
                          and extract(day from h.date) = extract(day from v_hoje)));
  raise notice 'DIAG FERIADOS QUE BATEM HOJE: %', coalesce(v_linhas, 'nenhum');

  select string_agg(format('%s | %s | %s | recurring=%s | nacional=%s | regiao=%s', h.id, h.date, h.name, h.recurring, h.is_national, coalesce(h.region_code,'-')), E'\n  ')
    into v_linhas
    from public.holidays h
   where h.recurring;
  raise notice 'DIAG RECORRENTES CADASTRADOS: %', coalesce(v_linhas, 'nenhum');

  v_res := public.check_calling_hours('BR');
  raise notice 'DIAG check_calling_hours(BR): %', v_res;
end $$;
rollback;