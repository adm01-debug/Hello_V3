# public.chat_sessions

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `conversation_id` | `uuid` | sim |  |  |  |
| 3 | `visitor_token` | `text` | não |  |  |  |
| 4 | `visitor_name` | `text` | sim |  |  |  |
| 5 | `visitor_email` | `text` | sim |  |  |  |
| 6 | `origin_url` | `text` | sim |  |  |  |
| 7 | `user_agent` | `text` | sim |  |  |  |
| 8 | `ip_address` | `text` | sim |  |  |  |
| 9 | `referrer` | `text` | sim |  |  |  |
| 10 | `device_info` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `is_active` | `boolean` | sim | `true` |  |  |
| 12 | `last_seen_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chat_sessions_conversation_id_fkey | FOREIGN KEY | `FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| chat_sessions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| chat_sessions_visitor_token_key | UNIQUE | `UNIQUE (visitor_token)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| chat_sessions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX chat_sessions_pkey ON public.chat_sessions USING btree (id)` |
| chat_sessions_visitor_token_key | btree | visitor_token | sim | sim |  | `CREATE UNIQUE INDEX chat_sessions_visitor_token_key ON public.chat_sessions USING btree (visitor_token)` |
| idx_chat_sessions_active | btree | is_active | não | sim | `(is_active = true)` | `CREATE INDEX idx_chat_sessions_active ON public.chat_sessions USING btree (is_active) WHERE (is_active = true)` |
| idx_chat_sessions_conversation_id | btree | conversation_id | não | sim |  | `CREATE INDEX idx_chat_sessions_conversation_id ON public.chat_sessions USING btree (conversation_id)` |
| idx_chat_sessions_token | btree | visitor_token | não | sim |  | `CREATE INDEX idx_chat_sessions_token ON public.chat_sessions USING btree (visitor_token)` |


## Policies (RLS)

### `Admin/Supervisor manage chat sessions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admin/Supervisor view all chat sessions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Agents view sessions from assigned convs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `((conversation_id IS NOT NULL) AND (EXISTS ( SELECT 1    FROM conversations c   WHERE ((c.id = chat_sessions.conversation_id) AND (c.assigned_agent_name = get_user_agent_name())))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
