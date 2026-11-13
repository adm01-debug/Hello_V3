# public.voicemail_messages

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
| 2 | `caller_name` | `text` | sim |  |  |  |
| 3 | `caller_phone` | `text` | não |  |  |  |
| 4 | `agent_name` | `text` | sim |  |  |  |
| 5 | `duration_seconds` | `integer` | sim |  |  |  |
| 6 | `transcription` | `text` | sim |  |  |  |
| 7 | `audio_file_path` | `text` | sim |  |  |  |
| 8 | `is_read` | `boolean` | não | `false` |  |  |
| 9 | `is_urgent` | `boolean` | não | `false` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `read_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| voicemail_messages_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| voicemail_messages_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX voicemail_messages_pkey ON public.voicemail_messages USING btree (id)` |


## Policies (RLS)

### `Admins can manage voicemail`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Agents can view own voicemail`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (agent_name = get_user_agent_name()))` |
| WITH CHECK |  |

### `Agents or admins can insert voicemails`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(is_admin_or_supervisor() OR is_active_agent(agent_name))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
