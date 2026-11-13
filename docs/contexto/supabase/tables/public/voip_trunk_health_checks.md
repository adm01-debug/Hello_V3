# public.voip_trunk_health_checks

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
| 2 | `trunk_id` | `uuid` | não |  |  |  |
| 3 | `checked_at` | `timestamp with time zone` | não | `now()` |  |  |
| 4 | `reachable` | `boolean` | não |  |  |  |
| 5 | `latency_ms` | `integer` | sim |  |  |  |
| 6 | `error_message` | `text` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| voip_trunk_health_checks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| voip_trunk_health_checks_trunk_id_fkey | FOREIGN KEY | `FOREIGN KEY (trunk_id) REFERENCES voip_trunks(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_trunk_health_trunk_time | btree | trunk_id, checked_at | não | sim |  | `CREATE INDEX idx_trunk_health_trunk_time ON public.voip_trunk_health_checks USING btree (trunk_id, checked_at DESC)` |
| idx_voip_trunk_health_checks_trunk_id | btree | trunk_id | não | sim |  | `CREATE INDEX idx_voip_trunk_health_checks_trunk_id ON public.voip_trunk_health_checks USING btree (trunk_id)` |
| voip_trunk_health_checks_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX voip_trunk_health_checks_pkey ON public.voip_trunk_health_checks USING btree (id)` |


## Policies (RLS)

### `Admins read trunk health checks`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_user(( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `Service role inserts health checks`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `false` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_notify_trunk_offline | AFTER | INSERT | ROW | enabled | public.notify_trunk_offline |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
