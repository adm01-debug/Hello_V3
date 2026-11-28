-- Etapa 079 (achado A-057): reivindicacao ATOMICA do contato no discador.
--
-- Antes: `apiGetNextContact` lia a linha `pending` e `apiMarkDialing` gravava
-- `dialing` em duas idas ao banco, sem condicao de status no UPDATE. Duas abas
-- ou dois agentes na mesma campanha liam a MESMA linha e ambos gravavam
-- `dialing`: o mesmo cliente recebia duas ligacoes. `attempts` vinha do objeto
-- em memoria, entao duas tentativas simultaneas viravam uma (perda de
-- atualizacao).
--
-- Agora: uma unica operacao condicional. `FOR UPDATE SKIP LOCKED` faz
-- chamadores concorrentes pegarem contatos DIFERENTES, e `attempts = attempts
-- + 1` no proprio SQL elimina a perda de atualizacao.
--
-- Permissao: as policies de `dialer_queue` ja liberam UPDATE para qualquer
-- `authenticated` (20251224124524_38968a99-....sql:394-396), portanto a funcao
-- nao amplia acesso; ainda assim exige usuario autenticado e nao e executavel
-- por `anon` (REVOKE abaixo). `dialer_campaigns` e `dialer_queue` nao estao
-- entre as tabelas com `enforce_optimistic_lock` (20260418125824_....sql:2-20),
-- por isso nao ha `version` a enviar aqui.

create or replace function public.claim_next_dialer_contact(p_campaign_id uuid)
returns setof public.dialer_queue
language sql
security definer
set search_path = public
as $$
  update public.dialer_queue q
     set status = 'dialing',
         attempts = q.attempts + 1,
         last_attempt_at = now()
   where q.id = (
     select dq.id
       from public.dialer_queue dq
      where dq.campaign_id = p_campaign_id
        and dq.status = 'pending'
        and (dq.next_attempt_at is null or dq.next_attempt_at <= now())
        and auth.uid() is not null
      order by dq.priority desc, dq.created_at asc
        for update skip locked
      limit 1
   )
  returning q.*;
$$;

comment on function public.claim_next_dialer_contact(uuid) is
  'Reivindica o proximo contato pendente da campanha em uma unica operacao (etapa 079). Devolve a linha ja em status dialing, com attempts incrementado. Concorrentes recebem contatos diferentes (FOR UPDATE SKIP LOCKED). Exige usuario autenticado.';

revoke all on function public.claim_next_dialer_contact(uuid) from public, anon;
grant execute on function public.claim_next_dialer_contact(uuid) to authenticated;