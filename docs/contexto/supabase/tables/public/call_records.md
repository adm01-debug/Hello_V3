# public.call_records

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `contact_id` | `uuid` | sim |  |  |  |
| 3 | `contact_name` | `text` | não |  |  |  |
| 4 | `contact_phone` | `text` | não |  |  |  |
| 5 | `type` | `text` | não |  |  |  |
| 6 | `status` | `text` | não |  |  |  |
| 7 | `duration` | `integer` | sim | `0` |  |  |
| 8 | `timestamp` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `recording_url` | `text` | sim |  |  |  |
| 10 | `transcription` | `text` | sim |  |  |  |
| 11 | `notes` | `text` | sim |  |  |  |
| 12 | `agent_id` | `uuid` | sim |  |  |  |
| 13 | `agent_name` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| call_records_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| call_records_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| call_records_status_check | CHECK | `CHECK (status = ANY (ARRAY['completed'::text, 'missed'::text, 'voicemail'::text, 'busy'::text, 'no_answer'::text]))` |  |  | sim |
| call_records_type_check | CHECK | `CHECK (type = ANY (ARRAY['incoming'::text, 'outgoing'::text, 'missed'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| call_records_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX call_records_pkey ON public.call_records USING btree (id)` |
| idx_calls_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_calls_contact ON public.call_records USING btree (contact_id)` |
| idx_calls_timestamp | btree | timestamp | não | sim |  | `CREATE INDEX idx_calls_timestamp ON public.call_records USING btree ("timestamp" DESC)` |


## Policies (RLS)

### `Admins can manage call_records`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admins can view call_records`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
