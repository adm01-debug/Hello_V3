-- Etapas 143 e 144 (achado A-069) -- `TO authenticated` no restante das policies de `public`.
--
-- Mesmo metodo da etapa 052, mas com um criterio que torna a mudanca PROVAVELMENTE neutra
-- para `anon`: so restringe as policies em que TODOS os predicados existentes referenciam
-- `auth.*` ou os helpers de papel/identidade (`is_admin*`, `get_user_agent_name`,
-- `get_user_agent_id`, `has_role`, `is_supervisor`, `can_access*`). Para `anon` esses
-- predicados sempre foram falso/nulo -- ou seja, ele nunca passava por elas. O que muda e que
-- o predicado deixa de ser avaliado para `anon`, cortando a dependencia do EXECUTE dos helpers
-- concedido a ele (`20261122183000_...sql:11-13`); a revogacao desse EXECUTE e a etapa 146 e so
-- pode vir depois.
--
-- Ficam DE FORA, de proposito, e sao listadas no log para revisao individual:
--   - policies cujo predicado nao cita `auth.*`/helpers (ex.: `using (true)`) -- restringir
--     essas poderia quebrar leitura publica legitima antes do login;
--   - policies de `storage.objects`: restringir bucket errado quebra upload/download e isso
--     exige teste por bucket (etapa 145), que nao da para provar por SQL.
--
-- Uma transacao so (o workflow roda com --single-transaction): ou aplica tudo, ou nada.
-- `ALTER POLICY ... TO authenticated` nao recria a policy -- o predicado e preservado.
--
-- Reversao: `alter policy <nome> on public.<tabela> to public;` para cada uma restringida
-- (a lista completa esta no log do run, linha por linha).

do $$
declare
  r record;
  v_n int := 0;
  v_pulad int := 0;
  v_puladas text;
begin
  for r in
    select p.tablename, p.policyname
      from pg_policies p
     where p.schemaname = 'public'
       and p.roles = '{public}'
       and (p.qual is not null or p.with_check is not null)
       and coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')
             ~* '(auth\.|is_admin|get_user_agent_name|get_user_agent_id|has_role|is_supervisor|can_access)'
     order by p.tablename, p.policyname
  loop
    execute format('alter policy %I on public.%I to authenticated', r.policyname, r.tablename);
    v_n := v_n + 1;
    raise notice 'to authenticated: %.%', r.tablename, r.policyname;
  end loop;

  select count(*), string_agg(format('%s.%s [%s]', tablename, policyname, coalesce(with_check, qual)), ', ' order by tablename, policyname)
    into v_pulad, v_puladas
    from pg_policies
   where schemaname = 'public'
     and roles = '{public}';

  raise notice 'etapas 143/144: % policy(ies) de public restringida(s) a authenticated', v_n;
  raise notice 'etapas 143/144: % policy(ies) mantida(s) para revisao individual: %', v_pulad, left(coalesce(v_puladas, 'nenhuma'), 3500);
end $$;