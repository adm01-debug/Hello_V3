# public.queue_audio_prompts

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
| 2 | `name` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `kind` | `text` | não | `'moh'::text` |  |  |
| 5 | `storage_path` | `text` | não |  |  |  |
| 6 | `mime_type` | `text` | não | `'audio/mpeg'::text` |  |  |
| 7 | `file_size_bytes` | `bigint` | não | `0` |  |  |
| 8 | `duration_seconds` | `integer` | não | `0` |  |  |
| 9 | `is_active` | `boolean` | não | `true` |  |  |
| 10 | `created_by` | `uuid` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| queue_audio_prompts_duration_check | CHECK | `CHECK (duration_seconds >= 0 AND duration_seconds <= 3600)` |  |  | sim |
| queue_audio_prompts_kind_check | CHECK | `CHECK (kind = ANY (ARRAY['moh'::text, 'greeting'::text, 'position'::text, 'hold_time'::text, 'overflow'::text, 'off_hours'::text]))` |  |  | sim |
| queue_audio_prompts_mime_check | CHECK | `CHECK (mime_type ~~ 'audio/%'::text AND length(mime_type) <= 100)` |  |  | sim |
| queue_audio_prompts_name_not_blank | CHECK | `CHECK (length(btrim(name)) > 0 AND length(name) <= 120)` |  |  | sim |
| queue_audio_prompts_path_check | CHECK | `CHECK (length(btrim(storage_path)) > 0 AND length(storage_path) <= 1024)` |  |  | sim |
| queue_audio_prompts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| queue_audio_prompts_size_check | CHECK | `CHECK (file_size_bytes >= 0 AND file_size_bytes <= 20971520)` |  |  | sim |
| queue_audio_prompts_unique_name | UNIQUE | `UNIQUE (name)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.call_park_orbits | call_park_orbits_moh_prompt_id_fkey | moh_prompt_id | SET NULL |
| public.call_queues | call_queues_greeting_prompt_id_fkey | greeting_prompt_id | SET NULL |
| public.call_queues | call_queues_moh_prompt_id_fkey | moh_prompt_id | SET NULL |
| public.call_queues | call_queues_overflow_prompt_id_fkey | overflow_prompt_id | SET NULL |
| public.call_queues | call_queues_periodic_prompt_id_fkey | periodic_prompt_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_queue_audio_prompts_kind_active | btree | kind, is_active | não | sim |  | `CREATE INDEX idx_queue_audio_prompts_kind_active ON public.queue_audio_prompts USING btree (kind, is_active)` |
| queue_audio_prompts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX queue_audio_prompts_pkey ON public.queue_audio_prompts USING btree (id)` |
| queue_audio_prompts_unique_name | btree | name | sim | sim |  | `CREATE UNIQUE INDEX queue_audio_prompts_unique_name ON public.queue_audio_prompts USING btree (name)` |


## Policies (RLS)

### `queue_audio_prompts_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `queue_audio_prompts_write_staff`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_queue_audio_prompts_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
