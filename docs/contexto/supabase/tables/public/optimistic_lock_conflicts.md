# public.optimistic_lock_conflicts

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
| 2 | `table_name` | `text` | não |  |  |  |
| 3 | `record_id` | `text` | não |  |  |  |
| 4 | `user_id` | `uuid` | sim |  |  |  |
| 5 | `client_version` | `integer` | sim |  |  |  |
| 6 | `current_version` | `integer` | sim |  |  |  |
| 7 | `attempted_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| optimistic_lock_conflicts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_olc_table_time | btree | table_name, attempted_at | não | sim |  | `CREATE INDEX idx_olc_table_time ON public.optimistic_lock_conflicts USING btree (table_name, attempted_at DESC)` |
| idx_olc_user_time | btree | user_id, attempted_at | não | sim |  | `CREATE INDEX idx_olc_user_time ON public.optimistic_lock_conflicts USING btree (user_id, attempted_at DESC)` |
| optimistic_lock_conflicts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX optimistic_lock_conflicts_pkey ON public.optimistic_lock_conflicts USING btree (id)` |


## Policies (RLS)

### `olc_admin_supervisor_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_notify_lock_conflict_hotspot | AFTER | INSERT | ROW | enabled | public.notify_lock_conflict_hotspot |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
