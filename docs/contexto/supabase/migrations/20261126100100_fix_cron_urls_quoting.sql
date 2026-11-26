-- Correcao da etapa 040: no comando do cron a URL era um literal entre aspas
-- ('https://...'), e a migration anterior trocou so o miolo, deixando
-- url := 'public.edge_function_url('slug')' -- texto entre aspas, nao chamada de
-- funcao. O job executaria com erro de sintaxe.
--
-- Aqui o trecho quebrado e trocado inteiro, com replace() de string exata (sem
-- regex), e o resultado e validado com PREPARE antes de reagendar. Idempotente:
-- job que ja esta correto nao muda, e PREPARE prova a sintaxe.

DO $guard$
DECLARE
  r record;
  v_slug text;
  v_old text;
  v_new text;
  v_quebra text[] := '{}';
BEGIN
  FOR r IN
    SELECT jobname, schedule, command
      FROM cron.job
     WHERE command ~ 'edge_function_url'
     ORDER BY jobname
  LOOP
    v_slug := substring(r.command from 'edge_function_url\(''([a-z0-9-]+)');
    IF v_slug IS NULL THEN
      RAISE NOTICE 'job %: sem slug reconhecivel, pulando', r.jobname;
      CONTINUE;
    END IF;

    -- estado quebrado: 'public.edge_function_url('<slug>')'
    v_old := chr(39) || 'public.edge_function_url(' || chr(39) || v_slug || chr(39) || ')' || chr(39);
    -- estado correto:  public.edge_function_url('<slug>')
    v_new := replace(r.command, v_old, 'public.edge_function_url(' || chr(39) || v_slug || chr(39) || ')');

    IF v_new NOT LIKE '%url := public.edge_function_url(%' THEN
      RAISE NOTICE 'job %: comando nao ficou no formato esperado, pulando', r.jobname;
      CONTINUE;
    END IF;

    -- prova de sintaxe: planeja o comando sem executar (net.http_post nao roda).
    BEGIN
      EXECUTE format('PREPARE %I AS %s', 'chk_' || replace(r.jobname, '-', '_'), v_new);
      EXECUTE format('DEALLOCATE %I', 'chk_' || replace(r.jobname, '-', '_'));
    EXCEPTION WHEN OTHERS THEN
      v_quebra := v_quebra || (r.jobname || ': ' || SQLERRM);
      CONTINUE;
    END;

    IF v_new = r.command THEN
      RAISE NOTICE 'job %: ja estava correto', r.jobname;
    ELSE
      PERFORM cron.schedule(r.jobname, r.schedule, v_new);
      RAISE NOTICE 'job %: url agora e chamada de funcao', r.jobname;
    END IF;
  END LOOP;

  IF array_length(v_quebra, 1) > 0 THEN
    RAISE EXCEPTION 'comando invalido apos a correcao: %', array_to_string(v_quebra, ' | ');
  END IF;
END
$guard$
