# public.conversations

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `channel` | `text` | não |  |  |  |
| 3 | `status` | `text` | não | `'open'::text` |  |  |
| 4 | `priority` | `text` | não | `'normal'::text` |  |  |
| 5 | `subject` | `text` | sim |  |  |  |
| 6 | `assigned_agent_name` | `text` | sim |  |  |  |
| 7 | `contact_id` | `uuid` | sim |  |  |  |
| 8 | `account_id` | `uuid` | sim |  |  |  |
| 9 | `external_id` | `text` | sim |  |  |  |
| 10 | `external_metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `tags` | `text[]` | sim | `ARRAY[]::text[]` |  |  |
| 12 | `first_response_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `last_message_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `sla_first_response_due_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `sla_resolution_due_at` | `timestamp with time zone` | sim |  |  |  |
| 17 | `sla_breached` | `boolean` | sim | `false` |  |  |
| 18 | `unread_count` | `integer` | sim | `0` |  |  |
| 19 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 20 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 21 | `handoff_threshold` | `double precision` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| conversations_account_id_fkey | FOREIGN KEY | `FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| conversations_channel_check | CHECK | `CHECK (channel = ANY (ARRAY['voice'::text, 'whatsapp'::text, 'email'::text, 'chat'::text, 'sms'::text]))` |  |  | sim |
| conversations_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| conversations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| conversations_priority_check | CHECK | `CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]))` |  |  | sim |
| conversations_status_check | CHECK | `CHECK (status = ANY (ARRAY['open'::text, 'pending'::text, 'resolved'::text, 'closed'::text, 'snoozed'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.bot_conversations | bot_conversations_conversation_id_fkey | conversation_id | CASCADE |
| public.chat_sessions | chat_sessions_conversation_id_fkey | conversation_id | SET NULL |
| public.conversation_messages | conversation_messages_conversation_id_fkey | conversation_id | CASCADE |
| public.email_tickets | email_tickets_conversation_id_fkey | conversation_id | CASCADE |
| public.kb_article_views | kb_article_views_conversation_id_fkey | conversation_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| conversations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id)` |
| idx_conversations_account_id | btree | account_id | não | sim |  | `CREATE INDEX idx_conversations_account_id ON public.conversations USING btree (account_id)` |
| idx_conversations_assigned_agent | btree | assigned_agent_name | não | sim |  | `CREATE INDEX idx_conversations_assigned_agent ON public.conversations USING btree (assigned_agent_name)` |
| idx_conversations_channel | btree | channel | não | sim |  | `CREATE INDEX idx_conversations_channel ON public.conversations USING btree (channel)` |
| idx_conversations_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_conversations_contact_id ON public.conversations USING btree (contact_id)` |
| idx_conversations_last_message | btree | last_message_at | não | sim |  | `CREATE INDEX idx_conversations_last_message ON public.conversations USING btree (last_message_at DESC)` |
| idx_conversations_status | btree | status | não | sim |  | `CREATE INDEX idx_conversations_status ON public.conversations USING btree (status)` |


## Policies (RLS)

### `Admin/Supervisor manage conversations`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admin/Supervisor view all conversations`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Agents update assigned conversations`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(assigned_agent_name = get_user_agent_name())` |
| WITH CHECK | `(assigned_agent_name = get_user_agent_name())` |

### `Agents view assigned conversations`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(assigned_agent_name = get_user_agent_name())` |
| WITH CHECK |  |

### `Users can view their own conversations`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `((( SELECT auth.uid() AS uid) = id) OR (EXISTS ( SELECT 1    FROM user_profiles   WHERE ((user_profiles.id = ( SELECT auth.uid() AS uid)) AND (user_profiles.role = ANY (ARRAY['admin'::text, 'supervisor'::text]))))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_conversations_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
