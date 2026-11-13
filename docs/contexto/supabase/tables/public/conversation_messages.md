# public.conversation_messages

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
| 2 | `conversation_id` | `uuid` | não |  |  |  |
| 3 | `direction` | `text` | não |  |  |  |
| 4 | `sender_type` | `text` | não |  |  |  |
| 5 | `sender_name` | `text` | sim |  |  |  |
| 6 | `sender_identifier` | `text` | sim |  |  |  |
| 7 | `content` | `text` | não |  |  |  |
| 8 | `content_type` | `text` | não | `'text'::text` |  |  |
| 9 | `attachments` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 10 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `is_private_note` | `boolean` | sim | `false` |  |  |
| 12 | `read_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| conversation_messages_content_type_check | CHECK | `CHECK (content_type = ANY (ARRAY['text'::text, 'html'::text, 'markdown'::text, 'audio'::text, 'image'::text, 'file'::text]))` |  |  | sim |
| conversation_messages_conversation_id_fkey | FOREIGN KEY | `FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| conversation_messages_direction_check | CHECK | `CHECK (direction = ANY (ARRAY['inbound'::text, 'outbound'::text, 'internal'::text]))` |  |  | sim |
| conversation_messages_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| conversation_messages_sender_type_check | CHECK | `CHECK (sender_type = ANY (ARRAY['contact'::text, 'agent'::text, 'bot'::text, 'system'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| conversation_messages_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX conversation_messages_pkey ON public.conversation_messages USING btree (id)` |
| idx_conversation_messages_conversation_id | btree | conversation_id | não | sim |  | `CREATE INDEX idx_conversation_messages_conversation_id ON public.conversation_messages USING btree (conversation_id)` |
| idx_messages_conversation | btree | conversation_id, created_at | não | sim |  | `CREATE INDEX idx_messages_conversation ON public.conversation_messages USING btree (conversation_id, created_at)` |
| idx_messages_direction | btree | direction | não | sim |  | `CREATE INDEX idx_messages_direction ON public.conversation_messages USING btree (direction)` |


## Policies (RLS)

### `Admin/Supervisor manage messages`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admin/Supervisor view all messages`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Agents insert in assigned conversations`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM conversations c   WHERE ((c.id = conversation_messages.conversation_id) AND (c.assigned_agent_name = get_user_agent_name())))))` |

### `Agents view messages from assigned convs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(EXISTS ( SELECT 1    FROM conversations c   WHERE ((c.id = conversation_messages.conversation_id) AND (c.assigned_agent_name = get_user_agent_name()))))` |
| WITH CHECK |  |

### `Users can view messages of their conversations`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `((EXISTS ( SELECT 1    FROM conversations c   WHERE ((c.id = conversation_messages.conversation_id) AND (c.assigned_agent_name = ( SELECT user_profiles.full_name            FROM user_profiles           WHERE (user_profiles.id = ( SELECT auth.uid() AS uid))))))) OR (EXISTS ( SELECT 1    FROM user_profiles   WHERE ((user_profiles.id = ( SELECT auth.uid() AS uid)) AND (user_profiles.role = ANY (ARRAY['admin'::text, 'supervisor'::text]))))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
