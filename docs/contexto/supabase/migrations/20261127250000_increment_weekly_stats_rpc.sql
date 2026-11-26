-- Etapa 126 (achado A-059): os pontos da semana passam a ser somados no banco.
--
-- Antes: src/hooks/useGamification.ts lia a linha da semana, somava em JavaScript e gravava
-- (read-modify-write). A tabela tem UNIQUE(agent_id, week_start), entao duas execucoes
-- concorrentes que caissem no ramo de insert faziam a segunda falhar com 23505 — e o erro era
-- descartado, com os pontos da semana perdidos. Duas chamadas terminando juntas perdiam placar.
--
-- Agora: um unico INSERT ... ON CONFLICT DO UPDATE soma dentro do banco, em uma instrucao. Nao
-- existe janela entre ler e gravar porque nao existe leitura.
--
-- Semantica preservada do hook antigo:
--   • contadores (calls, duration, badges, points) SOMAM;
--   • medias (satisfaction, performance) SUBSTITUEM o valor quando enviadas e ficam como estao
--     quando vem null — antes o ramo de update so tocava nas medias presentes no patch;
--   • na primeira linha da semana, media ausente vira 0 (era o DEFAULT da coluna).

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
    avg_satisfaction = coalesce(excluded.avg_satisfaction, s.avg_satisfaction),
    avg_performance = coalesce(excluded.avg_performance, s.avg_performance),
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$

comment on function public.increment_weekly_stats(uuid, date, integer, integer, integer, integer, numeric, numeric) is
  'Etapa 126: soma o placar semanal de um agente em uma unica instrucao (INSERT ... ON CONFLICT DO UPDATE). Substitui o read-modify-write de useGamification.ts, que perdia pontos quando duas gravacoes coincidiam. Contadores somam; medias substitutem quando enviadas e sao ignoradas quando null.'

-- Mesma postura das demais RPCs (20261122183000): nada de PUBLIC/anon.
revoke execute on function public.increment_weekly_stats(uuid, date, integer, integer, integer, integer, numeric, numeric) from public, anon

grant execute on function public.increment_weekly_stats(uuid, date, integer, integer, integer, integer, numeric, numeric) to authenticated, service_role
