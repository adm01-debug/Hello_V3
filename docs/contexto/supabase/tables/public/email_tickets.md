# public.email_tickets

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
| 2 | `conversation_id` | `uuid` | não |  |  |  |
| 3 | `message_id` | `text` | sim |  |  |  |
| 4 | `in_reply_to` | `text` | sim |  |  |  |
| 5 | `thread_id` | `text` | sim |  |  |  |
| 6 | `from_email` | `text` | não |  |  |  |
| 7 | `to_emails` | `text[]` | não |  |  |  |
| 8 | `cc_emails` | `text[]` | sim |  |  |  |
| 9 | `subject` | `text` | não |  |  |  |
| 10 | `body_text` | `text` | sim |  |  |  |
| 11 | `body_html` | `text` | sim |  |  |  |
| 12 | `headers` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 13 | `received_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| email_tickets_conversation_id_fkey | FOREIGN KEY | `FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| email_tickets_message_id_key | UNIQUE | `UNIQUE (message_id)` |  |  | sim |
| email_tickets_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| email_tickets_message_id_key | btree | message_id | sim | sim |  | `CREATE UNIQUE INDEX email_tickets_message_id_key ON public.email_tickets USING btree (message_id)` |
| email_tickets_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX email_tickets_pkey ON public.email_tickets USING btree (id)` |
| idx_email_tickets_conversation_id | btree | conversation_id | não | sim |  | `CREATE INDEX idx_email_tickets_conversation_id ON public.email_tickets USING btree (conversation_id)` |
| idx_email_tickets_thread | btree | thread_id | não | sim |  | `CREATE INDEX idx_email_tickets_thread ON public.email_tickets USING btree (thread_id)` |


## Policies (RLS)

### `Admin/Supervisor manage email tickets`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admin/Supervisor view all email tickets`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Agents view tickets from assigned convs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(EXISTS ( SELECT 1    FROM conversations c   WHERE ((c.id = email_tickets.conversation_id) AND (c.assigned_agent_name = get_user_agent_name()))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
