# public.voice_prints

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `label` | `text` | não | `'primary'::text` |  |  |
| 4 | `embedding` | `jsonb` | não |  |  |  |
| 5 | `feature_summary` | `jsonb` | sim |  |  |  |
| 6 | `sample_count` | `integer` | não | `1` |  |  |
| 7 | `confidence_baseline` | `numeric(5,4)` | não | `0.85` |  |  |
| 8 | `enrolled_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `last_verified_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `is_active` | `boolean` | não | `true` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| voice_prints_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| voice_prints_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_voice_prints_user | btree | user_id | não | sim | `(is_active = true)` | `CREATE INDEX idx_voice_prints_user ON public.voice_prints USING btree (user_id) WHERE (is_active = true)` |
| idx_voice_prints_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_voice_prints_user_id ON public.voice_prints USING btree (user_id)` |
| voice_prints_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX voice_prints_pkey ON public.voice_prints USING btree (id)` |


## Policies (RLS)

### `Admins view all voice prints`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_user(( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `Users manage their own voice prints`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_voice_prints_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
