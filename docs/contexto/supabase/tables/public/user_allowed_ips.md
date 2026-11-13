# public.user_allowed_ips

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
| 3 | `ip_address` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `is_cidr` | `boolean` | não | `false` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_allowed_ips_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_allowed_ips_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_allowed_ips_user_id_ip_address_key | UNIQUE | `UNIQUE (user_id, ip_address)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_allowed_ips_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_user_allowed_ips_user_id ON public.user_allowed_ips USING btree (user_id)` |
| user_allowed_ips_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_allowed_ips_pkey ON public.user_allowed_ips USING btree (id)` |
| user_allowed_ips_user_id_ip_address_key | btree | user_id, ip_address | sim | sim |  | `CREATE UNIQUE INDEX user_allowed_ips_user_id_ip_address_key ON public.user_allowed_ips USING btree (user_id, ip_address)` |


## Policies (RLS)

### `Admins can manage user_allowed_ips`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(get_user_role() = 'admin'::text)` |
| WITH CHECK |  |

### `Users can view own allowed_ips`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
