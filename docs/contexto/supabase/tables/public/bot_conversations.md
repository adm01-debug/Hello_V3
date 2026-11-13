# public.bot_conversations

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
| 3 | `user_message` | `text` | não |  |  |  |
| 4 | `bot_response` | `text` | não |  |  |  |
| 5 | `intent` | `text` | sim |  |  |  |
| 6 | `confidence` | `numeric(3,2)` | sim |  |  |  |
| 7 | `suggested_articles` | `uuid[]` | sim | `ARRAY[]::uuid[]` |  |  |
| 8 | `handoff_triggered` | `boolean` | sim | `false` |  |  |
| 9 | `handoff_reason` | `text` | sim |  |  |  |
| 10 | `response_time_ms` | `integer` | sim |  |  |  |
| 11 | `model_used` | `text` | sim | `'google/gemini-2.5-flash'::text` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bot_conversations_confidence_check | CHECK | `CHECK (confidence >= 0::numeric AND confidence <= 1::numeric)` |  |  | sim |
| bot_conversations_conversation_id_fkey | FOREIGN KEY | `FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| bot_conversations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bot_conversations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX bot_conversations_pkey ON public.bot_conversations USING btree (id)` |
| idx_bot_conversations_conversation_id | btree | conversation_id | não | sim |  | `CREATE INDEX idx_bot_conversations_conversation_id ON public.bot_conversations USING btree (conversation_id)` |
| idx_bot_conversations_handoff | btree | handoff_triggered | não | sim | `(handoff_triggered = true)` | `CREATE INDEX idx_bot_conversations_handoff ON public.bot_conversations USING btree (handoff_triggered) WHERE (handoff_triggered = true)` |


## Policies (RLS)

### `Admin/Supervisor insert bot conversations`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admin/Supervisor view bot conversations`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Agents view bot convs from assigned`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(EXISTS ( SELECT 1    FROM conversations c   WHERE ((c.id = bot_conversations.conversation_id) AND (c.assigned_agent_name = get_user_agent_name()))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
