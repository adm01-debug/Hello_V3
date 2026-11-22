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
      USING HINT = 'Registro alterado por outro usu�rio. Recarregue antes de salvar.';
  END IF;

  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$function$
