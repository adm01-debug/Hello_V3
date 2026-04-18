-- 1. Adicionar coluna version em accounts e success_plans
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.success_plans ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- 2. Criar tabela de auditoria de conflitos (append-only)
CREATE TABLE IF NOT EXISTS public.optimistic_lock_conflicts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  user_id UUID,
  client_version INTEGER,
  current_version INTEGER,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_olc_table_time
  ON public.optimistic_lock_conflicts (table_name, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_olc_user_time
  ON public.optimistic_lock_conflicts (user_id, attempted_at DESC);

ALTER TABLE public.optimistic_lock_conflicts ENABLE ROW LEVEL SECURITY;

-- Apenas admin/supervisor leem; ninguém faz INSERT/UPDATE/DELETE direto (apenas via trigger SECURITY DEFINER)
DROP POLICY IF EXISTS "olc_admin_supervisor_select" ON public.optimistic_lock_conflicts;
CREATE POLICY "olc_admin_supervisor_select"
  ON public.optimistic_lock_conflicts
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_supervisor());

-- 3. Atualizar função enforce_optimistic_lock para registrar conflito antes de lançar
CREATE OR REPLACE FUNCTION public.enforce_optimistic_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.version IS NOT NULL
     AND NEW.version <> OLD.version THEN
    -- Registra o conflito (best-effort; falha de auditoria não impede a exceção)
    BEGIN
      INSERT INTO public.optimistic_lock_conflicts (
        table_name, record_id, user_id, client_version, current_version
      ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id::text, OLD.id::text),
        auth.uid(),
        NEW.version,
        OLD.version
      );
    EXCEPTION WHEN OTHERS THEN
      NULL; -- nunca bloquear o fluxo principal por falha de auditoria
    END;

    RAISE EXCEPTION 'OPTIMISTIC_LOCK_CONFLICT'
      USING HINT = 'Registro alterado por outro usuário. Recarregue antes de salvar.';
  END IF;

  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.enforce_optimistic_lock() IS
'Trigger BEFORE UPDATE para locking otimista. Se NEW.version divergir de OLD.version, registra conflito em optimistic_lock_conflicts (best-effort) e lança OPTIMISTIC_LOCK_CONFLICT. Cobre: deals, contacts, agents, cadences, playbooks, accounts, success_plans.';

-- 4. Anexar trigger nas duas novas tabelas
DROP TRIGGER IF EXISTS enforce_optimistic_lock_accounts ON public.accounts;
CREATE TRIGGER enforce_optimistic_lock_accounts
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_optimistic_lock();

DROP TRIGGER IF EXISTS enforce_optimistic_lock_success_plans ON public.success_plans;
CREATE TRIGGER enforce_optimistic_lock_success_plans
  BEFORE UPDATE ON public.success_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_optimistic_lock();