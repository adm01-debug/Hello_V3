-- Etapa 017 — gate: o indice unico parcial existe e realmente barra a reentrega de WhatsApp.
-- Transacao revertida no fim.

begin;

-- ---------------------------------------------------------------------------
-- Passo 1: o indice existe, e UNIQUE e e parcial.
-- ---------------------------------------------------------------------------
do $$
declare
  v_def text;
begin
  select indexdef into v_def from pg_indexes
   where schemaname = 'public' and tablename = 'conversation_messages'
     and indexname = 'idx_conversation_messages_msgid';

  if v_def is null then
    raise exception 'FALHA 1: idx_conversation_messages_msgid nao existe';
  end if;
  if position('UNIQUE' in v_def) = 0 then
    raise exception 'FALHA 1: o indice nao e UNIQUE: %', v_def;
  end if;
  if position('WHERE' in v_def) = 0 then
    raise exception 'FALHA 1: o indice nao e parcial — mensagens sem message_id colidiriam no NULL: %', v_def;
  end if;
  if position('message_id' in v_def) = 0 then
    raise exception 'FALHA 1: o indice nao usa metadata->>message_id: %', v_def;
  end if;

  raise notice '1/4 ok: indice unico parcial presente (%)', v_def;
end $$;

-- ---------------------------------------------------------------------------
-- Passo 2: nao existe duplicata hoje (invariante a manter).
-- ---------------------------------------------------------------------------
do $$
declare
  v_dups int;
  v_linhas bigint;
begin
  select count(*) into v_linhas from public.conversation_messages;
  select count(*) into v_dups from (
    select metadata->>'message_id' as mid
      from public.conversation_messages
     where metadata->>'message_id' is not null
     group by 1 having count(*) > 1) t;

  if v_dups > 0 then
    raise exception 'FALHA 2: % message_id duplicado(s) em % linha(s)', v_dups, v_linhas;
  end if;

  raise notice '2/4 ok: 0 message_id duplicado em % linha(s) de conversation_messages', v_linhas;
end $$;

-- ---------------------------------------------------------------------------
-- Passo 3: a segunda gravacao do mesmo message_id e recusada pelo banco (23P01/23505).
-- ---------------------------------------------------------------------------
do $$
declare
  v_conv uuid;
  v_id1 uuid;
  v_id2 uuid;
  v_codigo text;
  v_msg text;
begin
  select id into v_conv from public.conversations order by created_at limit 1;
  if v_conv is null then
    raise exception 'FALHA 3: sem conversa para o teste de insercao';
  end if;

  insert into public.conversation_messages (conversation_id, content, content_type, direction, sender_type, metadata)
  values (v_conv, 'gate-017 primeira', 'text', 'inbound', 'contact', jsonb_build_object('message_id', 'gate-017-msg'))
  returning id into v_id1;

  begin
    insert into public.conversation_messages (conversation_id, content, content_type, direction, sender_type, metadata)
    values (v_conv, 'gate-017 reentrega', 'text', 'inbound', 'contact', jsonb_build_object('message_id', 'gate-017-msg'))
    returning id into v_id2;
    raise exception 'FALHA 3: a reentrega do mesmo message_id foi aceita (id %)', v_id2;
  exception when unique_violation then
    get stacked diagnostics v_codigo = returned_sqlstate, v_msg = message_text;
    if v_codigo not in ('23505', '23P01') then
      raise exception 'FALHA 3: recusa inesperada (%): %', v_codigo, v_msg;
    end if;
  end;

  raise notice '3/4 ok: reentrega do mesmo message_id recusada pelo indice (%) — a idempotencia deixou de ser so leitura', v_codigo;
end $$;

-- ---------------------------------------------------------------------------
-- Passo 4: mensagens sem message_id continuam podendo se repetir (indice parcial).
-- ---------------------------------------------------------------------------
do $$
declare
  v_conv uuid;
  v_n int;
begin
  select id into v_conv from public.conversations order by created_at limit 1;

  insert into public.conversation_messages (conversation_id, content, content_type, direction, sender_type, metadata)
  values (v_conv, 'gate-017 saida 1', 'text', 'outbound', 'agent', null),
         (v_conv, 'gate-017 saida 2', 'text', 'outbound', 'agent', null),
         (v_conv, 'gate-017 saida 3', 'text', 'outbound', 'agent', jsonb_build_object('canal', 'sem-message-id'));

  select count(*) into v_n from public.conversation_messages
   where content like 'gate-017 saida %';
  if v_n <> 3 then
    raise exception 'FALHA 4: esperava 3 mensagens de saida, obtive % — o indice parcial bloqueou NULL', v_n;
  end if;

  raise notice '4/4 ok: 3 mensagens sem message_id conviveram — o WHERE do indice protege as de saida';
end $$;

rollback;