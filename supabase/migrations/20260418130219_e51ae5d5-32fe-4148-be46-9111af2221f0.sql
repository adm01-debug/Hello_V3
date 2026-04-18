-- Onda 26: Optimistic Locking expandido para agents, cadences, playbooks
-- Reaproveita public.enforce_optimistic_lock() criada na Onda 24

-- agents
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

DROP TRIGGER IF EXISTS agents_optimistic_lock ON public.agents;
CREATE TRIGGER agents_optimistic_lock
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_optimistic_lock();

-- cadences
ALTER TABLE public.cadences
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

DROP TRIGGER IF EXISTS cadences_optimistic_lock ON public.cadences;
CREATE TRIGGER cadences_optimistic_lock
  BEFORE UPDATE ON public.cadences
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_optimistic_lock();

-- playbooks (criar tabela apenas se ainda não existir é fora de escopo;
-- o padrão é aplicado se ela existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'playbooks'
  ) THEN
    EXECUTE 'ALTER TABLE public.playbooks ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1';
    EXECUTE 'DROP TRIGGER IF EXISTS playbooks_optimistic_lock ON public.playbooks';
    EXECUTE 'CREATE TRIGGER playbooks_optimistic_lock BEFORE UPDATE ON public.playbooks FOR EACH ROW EXECUTE FUNCTION public.enforce_optimistic_lock()';
  END IF;
END
$$;