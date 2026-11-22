-- REVERTE 20261122340000. A restricao por dono quebrou o call park: o agente
-- precisa ver os slots ocupados por COLEGAS para recuperar a chamada
-- (useBlfBoard.ts le todos os slots 'parked'; useCallPark.ts recupera por id).
-- Sem visibilidade cruzada o slot aparece vazio e a chamada fica presa.
-- contact_phone aqui e dado operacional de uma chamada em curso, ja visivel no
-- softphone do agente; nao e base de contatos (contacts segue restritivo).

DROP POLICY IF EXISTS parked_calls_select_self_or_staff ON public.parked_calls;

CREATE POLICY parked_calls_select_auth
  ON public.parked_calls
  FOR SELECT
  TO authenticated
  USING (true);
