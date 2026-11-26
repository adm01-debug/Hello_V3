-- Gate da etapa 002 (achado A-019): as RPCs de lockout de login nao podem ser
-- chamaveis pelo navegador.
--
-- Antes: SECURITY DEFINER com EXECUTE para anon — saber o email bastava para
-- travar a conta de um operador (5 falhas) e para zerar o contador de falhas.
-- Depois: chamaveis apenas pela edge login-attempt (service role).
--
-- Roda dentro de transacao revertida no fim (nada fica gravado no banco).
-- Qualquer passo fora do esperado levanta excecao: com ON_ERROR_STOP o job fica
-- vermelho. Rodar com: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\set ON_ERROR_STOP on
begin;

do $$
declare
  v_assinatura text;
begin
  for v_assinatura in
    select unnest(array[
      'public.check_login_lockout(text)',
      'public.record_failed_login(text, text, text)',
      'public.record_successful_login(text, text, text)'
    ])
  loop
    if has_function_privilege('anon', v_assinatura, 'EXECUTE') then
      raise exception 'FALHA: anon ainda executa % (a conta de qualquer operador pode ser travada por terceiros)', v_assinatura;
    end if;
    if has_function_privilege('authenticated', v_assinatura, 'EXECUTE') then
      raise exception 'FALHA: authenticated ainda executa % (usuario logado pode zerar o lockout de outro)', v_assinatura;
    end if;
    if not has_function_privilege('service_role', v_assinatura, 'EXECUTE') then
      raise exception 'FALHA: service_role perdeu EXECUTE em % (a edge login-attempt para de funcionar)', v_assinatura;
    end if;
    raise notice 'OK: % exclusiva de service_role', v_assinatura;
  end loop;
end $$;

\echo '=== fim: nada foi gravado (rollback) ==='
rollback;
