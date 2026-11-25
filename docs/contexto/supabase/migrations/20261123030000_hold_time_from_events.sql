-- E069 — Preencher call_sessions.hold_time_seconds a partir dos hold_events.
-- Trigger idempotente: recalcula a soma inteira (nao incrementa), entao reexecucao nao dobra.
-- Dispara em AFTER UPDATE OF ended_at ON public.hold_events.

CREATE OR REPLACE FUNCTION public.recalc_hold_time_from_events()
RETURNS trigger
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  -- Descobre a sessao do evento alterado (novo ou antigo, caso call_session_id mude)
  v_session_id := COALESCE(NEW.call_session_id, OLD.call_session_id);
  IF v_session_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  UPDATE public.call_sessions cs
  SET hold_time_seconds = COALESCE((
    SELECT SUM(EXTRACT(EPOCH FROM (he.ended_at - he.started_at)))::integer
    FROM public.hold_events he
    WHERE he.call_session_id = v_session_id
      AND he.ended_at IS NOT NULL
  ), 0)
  WHERE cs.id = v_session_id;

  RETURN COALESCE(NEW, OLD);
END;
$$

DROP TRIGGER IF EXISTS trg_hold_events_recalc_hold_time ON public.hold_events

CREATE TRIGGER trg_hold_events_recalc_hold_time
AFTER UPDATE OF ended_at ON public.hold_events
FOR EACH ROW
WHEN (NEW.ended_at IS DISTINCT FROM OLD.ended_at)
EXECUTE FUNCTION public.recalc_hold_time_from_events()
