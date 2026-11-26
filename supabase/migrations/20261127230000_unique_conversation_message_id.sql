-- Etapa 017 — indice unico parcial para a deduplicacao de mensagens de WhatsApp.
--
-- whatsapp-inbound/index.ts:39-35 faz leitura-e-depois-escrita sobre
-- conversation_messages.metadata->>'message_id' sem indice unico: duas reentregas
-- simultaneas passam as duas pela leitura e duplicam a mensagem, inflando unread_count.
-- O indice e o que torna a idempotencia atomica.
--
-- Parcial de proposito: sem o WHERE, toda mensagem sem message_id (as de saida, por
-- exemplo) colidiria entre si no NULL.
--
-- CREATE INDEX CONCURRENTLY nao roda dentro de transacao e o canal de DDL do repo usa
-- --single-transaction, entao o indice e criado de forma normal. O bloco abaixo mede o
-- tamanho da tabela e aborta se ja houver duplicata — a migration nunca apaga dado.

do $$
declare
  v_linhas bigint;
  v_dups int;
begin
  select count(*) into v_linhas from public.conversation_messages;

  select count(*) into v_dups from (
    select metadata->>'message_id' as mid
      from public.conversation_messages
     where metadata->>'message_id' is not null
     group by 1
    having count(*) > 1
  ) t;

  raise notice 'etapa 017: conversation_messages tem % linha(s); % message_id duplicado(s)', v_linhas, v_dups;

  if v_dups > 0 then
    raise exception 'etapa 017: % message_id duplicado(s) — normalizar antes de criar o indice unico', v_dups;
  end if;
end $$;

create unique index if not exists idx_conversation_messages_msgid
  on public.conversation_messages ((metadata->>'message_id'))
  where metadata->>'message_id' is not null;

comment on index public.idx_conversation_messages_msgid is
  'Etapa 017: unicidade do message_id externo do WhatsApp (metadata->>message_id). Parcial porque mensagens sem o campo (saida, notas) repetem NULL. E o que torna atomica a deduplicacao de whatsapp-inbound.';