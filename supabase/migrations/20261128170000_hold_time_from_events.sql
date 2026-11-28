-- E069 - reemissao em 2026-11-28. A versao 20261123030000 consta em schema_migrations
-- sem os triggers que prometia (gate hold_time_from_events_rls_test 1/6 falhou).
--
-- Por que existe: o slot "Total espera" (ActiveCallsRealtime), o alerta de espera
-- (HoldAlertsTable) e a media da fila (useQueueMetrics) leem
-- call_sessions.hold_time_seconds, e nada no banco escrevia essa coluna - o front
-- so gravava hold_events com duration_seconds. Medido em 2026-11-28.
--
-- Forma: funcao recalcula a SOMA inteira da sessao (nao incrementa), entao
-- reexecucao ou dois eventos no mesmo instante nao dobram o valor.
-- Dispara em INSERT (evento ja fechado), UPDATE (ended_at/started_at/sessao) e
-- DELETE (evento removido devolve o total correto).
-- Idempotente: pode rodar de novo; o backfill so toca linha divergente.
-- Reverter: DROP TRIGGER trg_hold_events_recalc_hold_time{,_ins,_del} ON public.hold_events;
--           DROP FUNCTION public.recalc_hold_time_from_events();

CREATE OR REPLACE FUNCTION public.recalc_hold_time_from_events()
RETURNS trigger
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
BEGIN
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
$$;

DROP TRIGGER IF EXISTS trg_hold_events_recalc_hold_time ON public.hold_events;
DROP TRIGGER IF EXISTS trg_hold_events_recalc_hold_time_ins ON public.hold_events;
DROP TRIGGER IF EXISTS trg_hold_events_recalc_hold_time_del ON public.hold_events;

CREATE TRIGGER trg_hold_events_recalc_hold_time_ins
AFTER INSERT ON public.hold_events
FOR EACH ROW
WHEN (NEW.ended_at IS NOT NULL)
EXECUTE FUNCTION public.recalc_hold_time_from_events();

CREATE TRIGGER trg_hold_events_recalc_hold_time
AFTER UPDATE OF ended_at, started_at, call_session_id ON public.hold_events
FOR EACH ROW
WHEN (NEW.ended_at IS DISTINCT FROM OLD.ended_at
   OR NEW.started_at IS DISTINCT FROM OLD.started_at
   OR NEW.call_session_id IS DISTINCT FROM OLD.call_session_id)
EXECUTE FUNCTION public.recalc_hold_time_from_events();

CREATE TRIGGER trg_hold_events_recalc_hold_time_del
AFTER DELETE ON public.hold_events
FOR EACH ROW
EXECUTE FUNCTION public.recalc_hold_time_from_events();

-- Esperas ja fechadas antes deste trigger: o total da sessao passa a refletir o que
-- existe em hold_events sem depender de um evento novo.
WITH soma AS (
  SELECT he.call_session_id AS id,
         SUM(EXTRACT(EPOCH FROM (he.ended_at - he.started_at)))::integer AS segundos
    FROM public.hold_events he
   WHERE he.ended_at IS NOT NULL
     AND he.call_session_id IS NOT NULL
   GROUP BY he.call_session_id
)
UPDATE public.call_sessions cs
   SET hold_time_seconds = soma.segundos
  FROM soma
 WHERE cs.id = soma.id
   AND COALESCE(cs.hold_time_seconds, -1) IS DISTINCT FROM soma.segundos;
