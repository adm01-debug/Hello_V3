CREATE OR REPLACE FUNCTION public.increment_weekly_stats(p_agent_id uuid, p_week_start date, p_calls integer DEFAULT 0, p_duration_seconds integer DEFAULT 0, p_badges integer DEFAULT 0, p_points integer DEFAULT 0, p_avg_satisfaction numeric DEFAULT NULL::numeric, p_avg_performance numeric DEFAULT NULL::numeric)
 RETURNS agent_weekly_stats
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
