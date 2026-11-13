# public.rate_limit_alerts

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `ip_address` | `text` | não |  |  |  |
| 4 | `endpoint` | `text` | não |  |  |  |
| 5 | `request_count` | `integer` | não |  |  |  |
| 6 | `threshold` | `integer` | não |  |  |  |
| 7 | `severity` | `text` | sim | `'warning'::text` |  |  |
| 8 | `is_resolved` | `boolean` | sim | `false` |  |  |
| 9 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `resolved_by` | `uuid` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rate_limit_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| rate_limit_alerts_resolved_by_fkey | FOREIGN KEY | `FOREIGN KEY (resolved_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| rate_limit_alerts_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_rate_limit_alerts_resolved_by | btree | resolved_by | não | sim |  | `CREATE INDEX idx_rate_limit_alerts_resolved_by ON public.rate_limit_alerts USING btree (resolved_by)` |
| idx_rate_limit_alerts_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_rate_limit_alerts_user_id ON public.rate_limit_alerts USING btree (user_id)` |
| rate_limit_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rate_limit_alerts_pkey ON public.rate_limit_alerts USING btree (id)` |


## Policies (RLS)

### `Admins can update rate_limit_alerts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can view rate_limit_alerts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Only admins can insert rate limit alerts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
