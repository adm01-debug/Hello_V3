# public.parked_calls

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
| 2 | `orbit_id` | `uuid` | não |  |  |  |
| 3 | `slot_number` | `integer` | não |  |  |  |
| 4 | `call_session_id` | `uuid` | sim |  |  |  |
| 5 | `contact_phone` | `text` | sim |  |  |  |
| 6 | `contact_name` | `text` | sim |  |  |  |
| 7 | `parked_by` | `uuid` | sim |  |  |  |
| 8 | `parked_by_name` | `text` | sim |  |  |  |
| 9 | `retrieved_by` | `uuid` | sim |  |  |  |
| 10 | `retrieved_by_name` | `text` | sim |  |  |  |
| 11 | `status` | `text` | não | `'parked'::text` |  |  |
| 12 | `parked_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `expires_at` | `timestamp with time zone` | não |  |  |  |
| 14 | `retrieved_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `notes` | `text` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| parked_calls_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| parked_calls_orbit_id_fkey | FOREIGN KEY | `FOREIGN KEY (orbit_id) REFERENCES call_park_orbits(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| parked_calls_parked_by_fkey | FOREIGN KEY | `FOREIGN KEY (parked_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| parked_calls_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| parked_calls_retrieved_by_fkey | FOREIGN KEY | `FOREIGN KEY (retrieved_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| parked_calls_retrieved_consistency | CHECK | `CHECK (status = 'parked'::text AND retrieved_at IS NULL OR status <> 'parked'::text)` |  |  | sim |
| parked_calls_slot_positive | CHECK | `CHECK (slot_number >= 1)` |  |  | sim |
| parked_calls_status | CHECK | `CHECK (status = ANY (ARRAY['parked'::text, 'retrieved'::text, 'expired'::text, 'abandoned'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_parked_calls_orbit | btree | orbit_id | não | sim |  | `CREATE INDEX idx_parked_calls_orbit ON public.parked_calls USING btree (orbit_id)` |
| idx_parked_calls_parked_by | btree | parked_by | não | sim |  | `CREATE INDEX idx_parked_calls_parked_by ON public.parked_calls USING btree (parked_by)` |
| idx_parked_calls_session | btree | call_session_id | não | sim |  | `CREATE INDEX idx_parked_calls_session ON public.parked_calls USING btree (call_session_id)` |
| idx_parked_calls_status | btree | status, expires_at | não | sim |  | `CREATE INDEX idx_parked_calls_status ON public.parked_calls USING btree (status, expires_at)` |
| parked_calls_active_slot_uniq | btree | orbit_id, slot_number | sim | sim | `(status = 'parked'::text)` | `CREATE UNIQUE INDEX parked_calls_active_slot_uniq ON public.parked_calls USING btree (orbit_id, slot_number) WHERE (status = 'parked'::text)` |
| parked_calls_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX parked_calls_pkey ON public.parked_calls USING btree (id)` |


## Policies (RLS)

### `parked_calls_delete_admin`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `parked_calls_insert_self`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((parked_by = auth.uid()) AND (status = 'parked'::text))` |

### `parked_calls_select_auth`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `parked_calls_update_retrieve`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((status = 'parked'::text) OR is_admin_or_supervisor())` |
| WITH CHECK | `(is_admin_or_supervisor() OR ((status <> 'parked'::text) AND (retrieved_by = auth.uid())) OR ((status = 'parked'::text) AND (parked_by = auth.uid())))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_validate_parked_call | BEFORE | INSERT OR UPDATE | ROW | enabled | public.validate_parked_call |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
