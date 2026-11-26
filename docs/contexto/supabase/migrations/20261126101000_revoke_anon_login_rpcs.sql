-- Etapa 002 (achado A-019): as RPCs de lockout sao SECURITY DEFINER com EXECUTE
-- para anon (20260522144442_...sql:38-40). Sabendo so o email, qualquer um trava
-- a conta de um operador (5 falhas) e zera o contador para tentar senha sem
-- limite.
--
-- O unico caminho publico passa a ser a edge login-attempt (rate limit por IP,
-- chama as RPCs com service role). O cliente foi migrado para invocar a edge em
-- src/hooks/useLoginLockout.ts.
--
-- ORDEM OBRIGATORIA: aplicar SOMENTE depois do deploy da edge login-attempt
-- confirmado. Com o EXECUTE revogado e a edge fora do ar, o hook cai em
-- unknown -> o login falha fechado (etapa 003) e ninguem entra.
--
-- Reverter: GRANT EXECUTE ON FUNCTION ... TO anon, authenticated;

DO $guard$
DECLARE v_sig text;
BEGIN
  FOREACH v_sig IN ARRAY ARRAY[
    'public.check_login_lockout(text)',
    'public.record_failed_login(text, text, text)',
    'public.record_successful_login(text, text, text)'
  ] LOOP
    IF to_regprocedure(v_sig) IS NULL THEN
      RAISE EXCEPTION 'funcao ausente: %', v_sig;
    END IF;
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', v_sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', v_sig);
    RAISE NOTICE 'acl ajustada: %', v_sig;
  END LOOP;
END
$guard$
