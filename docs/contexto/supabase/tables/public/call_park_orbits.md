# public.call_park_orbits

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `name` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `slot_start` | `integer` | não | `701` |  |  |
| 5 | `slot_end` | `integer` | não | `710` |  |  |
| 6 | `park_timeout_seconds` | `integer` | não | `180` |  |  |
| 7 | `timeout_action` | `text` | não | `'return_parker'::text` |  |  |
| 8 | `timeout_target` | `text` | sim |  |  |  |
| 9 | `moh_prompt_id` | `uuid` | sim |  |  |  |
| 10 | `announce_slot` | `boolean` | não | `true` |  |  |
| 11 | `is_active` | `boolean` | não | `true` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| call_park_orbits_action | CHECK | `CHECK (timeout_action = ANY (ARRAY['return_parker'::text, 'ring_group'::text, 'queue'::text, 'extension'::text, 'voicemail'::text, 'hangup'::text]))` |  |  | sim |
| call_park_orbits_moh_prompt_id_fkey | FOREIGN KEY | `FOREIGN KEY (moh_prompt_id) REFERENCES queue_audio_prompts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| call_park_orbits_name_len | CHECK | `CHECK (char_length(btrim(name)) >= 1 AND char_length(btrim(name)) <= 80)` |  |  | sim |
| call_park_orbits_name_unique | UNIQUE | `UNIQUE (name)` |  |  | sim |
| call_park_orbits_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| call_park_orbits_slot_range | CHECK | `CHECK (slot_start >= 1 AND slot_end >= slot_start AND (slot_end - slot_start) <= 99)` |  |  | sim |
| call_park_orbits_timeout | CHECK | `CHECK (park_timeout_seconds >= 30 AND park_timeout_seconds <= 3600)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.parked_calls | parked_calls_orbit_id_fkey | orbit_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| call_park_orbits_name_unique | btree | name | sim | sim |  | `CREATE UNIQUE INDEX call_park_orbits_name_unique ON public.call_park_orbits USING btree (name)` |
| call_park_orbits_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX call_park_orbits_pkey ON public.call_park_orbits USING btree (id)` |
| idx_call_park_orbits_active | btree | is_active | não | sim |  | `CREATE INDEX idx_call_park_orbits_active ON public.call_park_orbits USING btree (is_active)` |


## Policies (RLS)

### `park_orbits_delete_admin`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `park_orbits_insert_admin`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `park_orbits_select_auth`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `park_orbits_update_admin`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_validate_park_orbit | BEFORE | INSERT OR UPDATE | ROW | enabled | public.validate_park_orbit |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
