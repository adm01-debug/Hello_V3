# public.redaction_log

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `call_session_id` | `uuid` | sim |  |  |  |
| 3 | `recording_path` | `text` | sim |  |  |  |
| 4 | `redacted_path` | `text` | sim |  |  |  |
| 5 | `pattern_type` | `text` | não |  |  |  |
| 6 | `match_count` | `integer` | não | `0` |  |  |
| 7 | `segments` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 8 | `status` | `text` | não | `'completed'::text` |  |  |
| 9 | `error_message` | `text` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| redaction_log_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| redaction_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_redaction_log_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_redaction_log_call_session_id ON public.redaction_log USING btree (call_session_id)` |
| idx_redaction_log_created | btree | created_at | não | sim |  | `CREATE INDEX idx_redaction_log_created ON public.redaction_log USING btree (created_at DESC)` |
| redaction_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX redaction_log_pkey ON public.redaction_log USING btree (id)` |


## Policies (RLS)

### `Admins view redaction log`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_user(( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
