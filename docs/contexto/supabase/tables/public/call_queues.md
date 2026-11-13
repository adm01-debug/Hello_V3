# public.call_queues

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
| 4 | `is_active` | `boolean` | não | `true` |  |  |
| 5 | `strategy` | `text` | não | `'ringall'::text` |  |  |
| 6 | `ring_timeout_seconds` | `integer` | não | `20` |  |  |
| 7 | `wrap_up_seconds` | `integer` | não | `0` |  |  |
| 8 | `max_wait_seconds` | `integer` | não | `300` |  |  |
| 9 | `max_queue_size` | `integer` | não | `50` |  |  |
| 10 | `priority` | `integer` | não | `0` |  |  |
| 11 | `overflow_action` | `text` | não | `'voicemail'::text` |  |  |
| 12 | `overflow_queue_id` | `uuid` | sim |  |  |  |
| 13 | `announce_position` | `boolean` | não | `false` |  |  |
| 14 | `announce_hold_time` | `boolean` | não | `false` |  |  |
| 15 | `announce_interval_seconds` | `integer` | não | `30` |  |  |
| 16 | `moh_enabled` | `boolean` | não | `true` |  |  |
| 17 | `moh_url` | `text` | sim |  |  |  |
| 18 | `created_by` | `uuid` | sim |  |  |  |
| 19 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 20 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 21 | `moh_prompt_id` | `uuid` | sim |  |  |  |
| 22 | `greeting_prompt_id` | `uuid` | sim |  |  |  |
| 23 | `periodic_prompt_id` | `uuid` | sim |  |  |  |
| 24 | `overflow_prompt_id` | `uuid` | sim |  |  |  |
| 25 | `greeting_enabled` | `boolean` | não | `false` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| call_queues_announce_interval_seconds_check | CHECK | `CHECK (announce_interval_seconds >= 10 AND announce_interval_seconds <= 600)` |  |  | sim |
| call_queues_greeting_prompt_id_fkey | FOREIGN KEY | `FOREIGN KEY (greeting_prompt_id) REFERENCES queue_audio_prompts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| call_queues_max_queue_size_check | CHECK | `CHECK (max_queue_size >= 1 AND max_queue_size <= 1000)` |  |  | sim |
| call_queues_max_wait_seconds_check | CHECK | `CHECK (max_wait_seconds >= 10 AND max_wait_seconds <= 7200)` |  |  | sim |
| call_queues_moh_prompt_id_fkey | FOREIGN KEY | `FOREIGN KEY (moh_prompt_id) REFERENCES queue_audio_prompts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| call_queues_moh_url_len | CHECK | `CHECK (moh_url IS NULL OR length(moh_url) <= 2048)` |  |  | sim |
| call_queues_name_not_blank | CHECK | `CHECK (length(btrim(name)) > 0)` |  |  | sim |
| call_queues_name_unique | UNIQUE | `UNIQUE (name)` |  |  | sim |
| call_queues_overflow_action_check | CHECK | `CHECK (overflow_action = ANY (ARRAY['voicemail'::text, 'transfer_queue'::text, 'callback'::text, 'hangup'::text]))` |  |  | sim |
| call_queues_overflow_not_self | CHECK | `CHECK (overflow_queue_id IS DISTINCT FROM id)` |  |  | sim |
| call_queues_overflow_prompt_id_fkey | FOREIGN KEY | `FOREIGN KEY (overflow_prompt_id) REFERENCES queue_audio_prompts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| call_queues_overflow_queue_id_fkey | FOREIGN KEY | `FOREIGN KEY (overflow_queue_id) REFERENCES call_queues(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| call_queues_periodic_prompt_id_fkey | FOREIGN KEY | `FOREIGN KEY (periodic_prompt_id) REFERENCES queue_audio_prompts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| call_queues_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| call_queues_priority_check | CHECK | `CHECK (priority >= 0 AND priority <= 100)` |  |  | sim |
| call_queues_ring_timeout_seconds_check | CHECK | `CHECK (ring_timeout_seconds >= 5 AND ring_timeout_seconds <= 300)` |  |  | sim |
| call_queues_strategy_check | CHECK | `CHECK (strategy = ANY (ARRAY['ringall'::text, 'roundrobin'::text, 'leastrecent'::text, 'fewestcalls'::text, 'skillbased'::text]))` |  |  | sim |
| call_queues_wrap_up_seconds_check | CHECK | `CHECK (wrap_up_seconds >= 0 AND wrap_up_seconds <= 600)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.call_queue_members | call_queue_members_queue_id_fkey | queue_id | CASCADE |
| public.call_queues | call_queues_overflow_queue_id_fkey | overflow_queue_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| call_queues_name_unique | btree | name | sim | sim |  | `CREATE UNIQUE INDEX call_queues_name_unique ON public.call_queues USING btree (name)` |
| call_queues_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX call_queues_pkey ON public.call_queues USING btree (id)` |
| idx_call_queues_active_priority | btree | is_active, priority | não | sim |  | `CREATE INDEX idx_call_queues_active_priority ON public.call_queues USING btree (is_active, priority DESC)` |
| idx_call_queues_greeting_prompt | btree | greeting_prompt_id | não | sim | `(greeting_prompt_id IS NOT NULL)` | `CREATE INDEX idx_call_queues_greeting_prompt ON public.call_queues USING btree (greeting_prompt_id) WHERE (greeting_prompt_id IS NOT NULL)` |
| idx_call_queues_moh_prompt | btree | moh_prompt_id | não | sim | `(moh_prompt_id IS NOT NULL)` | `CREATE INDEX idx_call_queues_moh_prompt ON public.call_queues USING btree (moh_prompt_id) WHERE (moh_prompt_id IS NOT NULL)` |
| idx_call_queues_overflow | btree | overflow_queue_id | não | sim | `(overflow_queue_id IS NOT NULL)` | `CREATE INDEX idx_call_queues_overflow ON public.call_queues USING btree (overflow_queue_id) WHERE (overflow_queue_id IS NOT NULL)` |
| idx_call_queues_overflow_prompt | btree | overflow_prompt_id | não | sim | `(overflow_prompt_id IS NOT NULL)` | `CREATE INDEX idx_call_queues_overflow_prompt ON public.call_queues USING btree (overflow_prompt_id) WHERE (overflow_prompt_id IS NOT NULL)` |
| idx_call_queues_periodic_prompt | btree | periodic_prompt_id | não | sim | `(periodic_prompt_id IS NOT NULL)` | `CREATE INDEX idx_call_queues_periodic_prompt ON public.call_queues USING btree (periodic_prompt_id) WHERE (periodic_prompt_id IS NOT NULL)` |


## Policies (RLS)

### `call_queues_manage_admin_supervisor`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `call_queues_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_call_queues_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_validate_call_queue | BEFORE | INSERT OR UPDATE | ROW | enabled | public.validate_call_queue |
| trg_validate_queue_audio_slots | BEFORE | INSERT OR UPDATE | ROW | enabled | public.validate_queue_audio_slots |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
