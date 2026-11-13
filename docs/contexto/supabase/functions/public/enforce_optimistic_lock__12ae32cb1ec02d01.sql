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
$function$
