-- BUG: o trigger enforce_optimistic_lock registrava o conflito e logo depois
-- lancava OPTIMISTIC_LOCK_CONFLICT. INSERT e RAISE rodam na MESMA transacao,
-- entao o proprio Postgres desfazia o registro. Medido em producao antes do
-- fix: UPDATE com version divergente -> excecao correta, 0 linhas gravadas.
-- Consequencia: ConcurrencyConflicts e o badge de conflitos do sidebar nunca
-- mostravam nada, e cleanup-lock-conflicts nunca tinha o que limpar.
--
-- FIX: o INSERT do conflito vai por dblink (segunda conexao, commita sozinha e
-- sobrevive ao rollback do RAISE). A credencial dessa conexao e um role de
-- privilegio minimo cuja senha e gerada aqui dentro e guardada apenas na Vault,
-- entao nenhum segredo entra no repositorio.
-- Se o dblink falhar por qualquer motivo, ha fallback para o INSERT local, que
-- preserva o comportamento antigo (sem piorar nada). O RAISE que protege o dado
-- acontece sempre.

CREATE EXTENSION IF NOT EXISTS dblink;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

DO $provision$
DECLARE
  v_pw       text := replace(gen_random_uuid()::text, '-', '');
  v_dsn      text;
  v_secret   uuid;
  v_host     text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'optimistic_lock_writer') THEN
    CREATE ROLE optimistic_lock_writer LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;

  EXECUTE format('ALTER ROLE optimistic_lock_writer PASSWORD %L', v_pw);

  v_host := 'db.' || COALESCE(
    NULLIF(current_setting('supabase.project_ref', true), ''),
    'cfmlmcdyjuotqobjapng'
  ) || '.supabase.co';

  v_dsn := format(
    'host=%s port=5432 dbname=postgres user=optimistic_lock_writer password=%s sslmode=require connect_timeout=5',
    v_host, v_pw
  );

  SELECT id INTO v_secret FROM vault.secrets WHERE name = 'optimistic_lock_dblink_dsn';
  IF v_secret IS NULL THEN
    PERFORM vault.create_secret(v_dsn, 'optimistic_lock_dblink_dsn',
      'Role de privilegio minimo usado pelo trigger enforce_optimistic_lock via dblink');
  ELSE
    PERFORM vault.update_secret(v_secret, v_dsn, 'optimistic_lock_dblink_dsn',
      'Role de privilegio minimo usado pelo trigger enforce_optimistic_lock via dblink');
  END IF;
END
$provision$;

GRANT USAGE ON SCHEMA public TO optimistic_lock_writer;
GRANT INSERT ON public.optimistic_lock_conflicts TO optimistic_lock_writer;

-- A tabela tem RLS ligado e so existia policy de SELECT, entao o INSERT vindo
-- do dblink era bloqueado. Esta policy libera escrita apenas para o role de
-- auditoria e exige os campos obrigatorios.
DROP POLICY IF EXISTS olc_writer_insert ON public.optimistic_lock_conflicts;
CREATE POLICY olc_writer_insert ON public.optimistic_lock_conflicts
  FOR INSERT TO optimistic_lock_writer
  WITH CHECK (
    table_name IS NOT NULL
    AND record_id IS NOT NULL
    AND attempted_at IS NOT NULL
  );

CREATE OR REPLACE FUNCTION public.enforce_optimistic_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_table  text := TG_TABLE_NAME;
  v_record text := COALESCE(NEW.id::text, OLD.id::text);
  v_user   uuid := auth.uid();
  v_dsn    text;
BEGIN
  IF NEW.version IS NOT NULL AND NEW.version <> OLD.version THEN
    BEGIN
      SELECT decrypted_secret::text INTO v_dsn
      FROM vault.decrypted_secrets
      WHERE name = 'optimistic_lock_dblink_dsn';

      IF v_dsn IS NOT NULL THEN
        PERFORM dblink_exec(
          v_dsn,
          format(
            'INSERT INTO public.optimistic_lock_conflicts '
            '(table_name, record_id, user_id, client_version, current_version) '
            'VALUES (%L, %L, %L, %s, %s)',
            v_table, v_record, v_user, NEW.version, OLD.version
          )
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- sem conexao auxiliar: cai no fallback local abaixo
    END;

    BEGIN
      INSERT INTO public.optimistic_lock_conflicts (
        table_name, record_id, user_id, client_version, current_version
      ) VALUES (v_table, v_record, v_user, NEW.version, OLD.version);
    EXCEPTION WHEN OTHERS THEN
      NULL; -- auditoria nunca pode bloquear o fluxo principal
    END;

    RAISE EXCEPTION 'OPTIMISTIC_LOCK_CONFLICT'
      USING HINT = 'Registro alterado por outro usuário. Recarregue antes de salvar.';
  END IF;

  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.enforce_optimistic_lock() IS
'Trigger BEFORE UPDATE de locking otimista. Se NEW.version divergir de OLD.version, grava o conflito em optimistic_lock_conflicts via dblink (conexao separada, sobrevive ao rollback do RAISE) com fallback local, e lanca OPTIMISTIC_LOCK_CONFLICT.';
