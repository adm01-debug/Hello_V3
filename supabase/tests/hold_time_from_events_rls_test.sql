-- Gate da E069: call_sessions.hold_time_seconds passa a refletir a soma de
-- hold_events (insert ja fechado, update de ended_at, delete e re-soma sem dobrar).
-- Roda com a credencial de service_role do workflow: cria dados proprios e apaga no fim.
\set ON_ERROR_STOP on

DO $g$
DECLARE
  v_sessao uuid;
  v_hold1 uuid;
  v_hold2 uuid;
  v_total integer;
BEGIN
  INSERT INTO public.call_sessions (caller_name, status, created_at)
  VALUES ('__gate_e069', 'completed', now())
  RETURNING id INTO v_sessao;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_hold_events_recalc_hold_time_ins') THEN
    RAISE EXCEPTION '1/6 trigger de INSERT ausente em hold_events';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_hold_events_recalc_hold_time') THEN
    RAISE EXCEPTION '2/6 trigger de UPDATE ausente em hold_events';
  END IF;

  INSERT INTO public.hold_events (call_session_id, agent_name, started_at, ended_at)
  VALUES (v_sessao, '__gate_e069', now() - interval '40 seconds', now() - interval '10 seconds')
  RETURNING id INTO v_hold1;

  SELECT hold_time_seconds INTO v_total FROM public.call_sessions WHERE id = v_sessao;
  IF COALESCE(v_total, -1) <> 30 THEN
    RAISE EXCEPTION '3/6 insert fechado nao somou 30s (valor=%)', v_total;
  END IF;
  RAISE NOTICE '3/6 insert de evento fechado soma a espera (30s)';

  INSERT INTO public.hold_events (call_session_id, agent_name, started_at)
  VALUES (v_sessao, '__gate_e069', now() - interval '5 seconds')
  RETURNING id INTO v_hold2;

  UPDATE public.hold_events SET ended_at = now() WHERE id = v_hold2;

  SELECT hold_time_seconds INTO v_total FROM public.call_sessions WHERE id = v_sessao;
  IF COALESCE(v_total, -1) <> 35 THEN
    RAISE EXCEPTION '4/6 update de ended_at nao somou (esperado 35, veio %)', v_total;
  END IF;
  RAISE NOTICE '4/6 update de ended_at soma o trecho novo (total 35s)';

  UPDATE public.hold_events SET started_at = started_at - interval '5 seconds' WHERE id = v_hold2;
  SELECT hold_time_seconds INTO v_total FROM public.call_sessions WHERE id = v_sessao;
  IF COALESCE(v_total, -1) <> 40 THEN
    RAISE EXCEPTION '5/6 mudar started_at nao recalculou (esperado 40, veio %)', v_total;
  END IF;

  DELETE FROM public.hold_events WHERE id = v_hold2;
  SELECT hold_time_seconds INTO v_total FROM public.call_sessions WHERE id = v_sessao;
  IF COALESCE(v_total, -1) <> 30 THEN
    RAISE EXCEPTION '6/6 delete nao devolveu o total (esperado 30, veio %)', v_total;
  END IF;
  RAISE NOTICE '5/6 e 6/6 re-soma idempotente: update de inicio e delete mantem o total correto';

  DELETE FROM public.hold_events WHERE call_session_id = v_sessao;
  DELETE FROM public.call_sessions WHERE id = v_sessao;
END
$g$;
