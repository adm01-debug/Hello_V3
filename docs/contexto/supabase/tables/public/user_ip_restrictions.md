# public.user_ip_restrictions

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
| 3 | `enabled` | `boolean` | não | `false` |  |  |
| 4 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 5 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_ip_restrictions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_ip_restrictions_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_ip_restrictions_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_ip_restrictions_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_user_ip_restrictions_user_id ON public.user_ip_restrictions USING btree (user_id)` |
| user_ip_restrictions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_ip_restrictions_pkey ON public.user_ip_restrictions USING btree (id)` |
| user_ip_restrictions_user_id_key | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX user_ip_restrictions_user_id_key ON public.user_ip_restrictions USING btree (user_id)` |


## Policies (RLS)

### `Admins can manage user_ip_restrictions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(get_user_role() = 'admin'::text)` |
| WITH CHECK |  |

### `Users can view own ip_restriction`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_user_ip_restrictions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
