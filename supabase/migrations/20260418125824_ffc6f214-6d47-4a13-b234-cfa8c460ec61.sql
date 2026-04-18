-- Função reutilizável de optimistic locking
CREATE OR REPLACE FUNCTION public.enforce_optimistic_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se cliente enviou version e ela diverge da atual, rejeita
  IF NEW.version IS NOT NULL
     AND NEW.version <> OLD.version THEN
    RAISE EXCEPTION 'OPTIMISTIC_LOCK_CONFLICT'
      USING HINT = 'Registro alterado por outro usuário. Recarregue antes de salvar.';
  END IF;

  -- Incrementa version
  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$$;

-- Coluna version em deals
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

DROP TRIGGER IF EXISTS deals_optimistic_lock ON public.deals;
CREATE TRIGGER deals_optimistic_lock
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_optimistic_lock();

-- Coluna version em contacts
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

DROP TRIGGER IF EXISTS contacts_optimistic_lock ON public.contacts;
CREATE TRIGGER contacts_optimistic_lock
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_optimistic_lock();