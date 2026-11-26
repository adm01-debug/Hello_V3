-- Etapa 126 (achado A-059) — correcao: a media antiga era zerada quando o patch nao trazia media.
--
-- A versao aplicada em 20261127250000 gravava as medias com coalesce(p_avg_satisfaction, 0) na
-- lista de VALUES — necessario para que a primeira linha da semana nasca com 0, como o DEFAULT
-- da coluna. O efeito colateral apareceu no gate: dentro do DO UPDATE, "excluded" carrega o valor
-- ja coalescido, ou seja, excluded.avg_satisfaction nunca e NULL. O ramo
-- "coalesce(excluded.avg_satisfaction, s.avg_satisfaction)" portanto nunca preservava nada e
-- sobrescrevia a media anterior com 0 sempre que a gravacao nao mandava media
-- (gate 126, run 45871456475: "FALHA 5: media sem valor enviado foi zerada (0.0 / 0.0)").
--
-- Correcao minima: no ramo de update o que decide e o PARAMETRO, nao o valor inserido. Sem
-- coalesce o parametro chega NULL e o valor atual da linha e preservado; com valor ele substitui.
-- A semantica do ramo de insert (primeira linha com media 0) fica intacta.

create or replace function public.increment_weekly_stats(
  p_agent_id uuid,
  p_week_start date,
  p_calls integer default 0,
  p_duration_seconds integer default 0,
  p_badges integer default 0,
  p_points integer default 0,
  p_avg_satisfaction numeric default null,
  p_avg_performance numeric default null
)
returns public.agent_weekly_stats
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.agent_weekly_stats;
begin
  if p_agent_id is null then
    raise exception 'increment_weekly_stats: p_agent_id obrigatorio';
  end if;
  if p_week_start is null then
    raise exception 'increment_weekly_stats: p_week_start obrigatorio';
  end if;
  if coalesce(p_calls, 0) < 0 or coalesce(p_duration_seconds, 0) < 0
     or coalesce(p_badges, 0) < 0 or coalesce(p_points, 0) < 0 then
    raise exception 'increment_weekly_stats: incremento negativo nao e aceito';
  end if;

  insert into public.agent_weekly_stats as s (
    agent_id, week_start, total_calls, total_duration_seconds,
    badges_earned, points_earned, avg_satisfaction, avg_performance, updated_at
  )
  values (
    p_agent_id, p_week_start, coalesce(p_calls, 0), coalesce(p_duration_seconds, 0),
    coalesce(p_badges, 0), coalesce(p_points, 0),
    coalesce(p_avg_satisfaction, 0), coalesce(p_avg_performance, 0), now()
  )
  on conflict (agent_id, week_start) do update set
    total_calls = s.total_calls + excluded.total_calls,
    total_duration_seconds = s.total_duration_seconds + excluded.total_duration_seconds,
    badges_earned = s.badges_earned + excluded.badges_earned,
    points_earned = s.points_earned + excluded.points_earned,
    avg_satisfaction = coalesce(p_avg_satisfaction, s.avg_satisfaction),
    avg_performance = coalesce(p_avg_performance, s.avg_performance),
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$

comment on function public.increment_weekly_stats(uuid, date, integer, integer, integer, integer, numeric, numeric) is
  'Etapa 126: soma o placar semanal de um agente em uma unica instrucao (INSERT ... ON CONFLICT DO UPDATE). Substitui o read-modify-write de useGamification.ts, que perdia pontos quando duas gravacoes coincidiam (23505 descartado). Contadores SOMAM; medias SUBSTITUEM quando enviadas e sao PRESERVADAS quando vem null. Primeira linha da semana nasce com media 0.'
