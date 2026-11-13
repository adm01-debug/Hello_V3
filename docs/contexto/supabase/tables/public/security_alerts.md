# public.security_alerts

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
| 2 | `alert_type` | `text` | não |  |  |  |
| 3 | `severity` | `text` | não | `'warning'::text` |  |  |
| 4 | `title` | `text` | não |  |  |  |
| 5 | `description` | `text` | não |  |  |  |
| 6 | `source_user_id` | `uuid` | sim |  |  |  |
| 7 | `source_user_email` | `text` | sim |  |  |  |
| 8 | `trigger_data` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `is_resolved` | `boolean` | não | `false` |  |  |
| 10 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `resolved_by` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| security_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| security_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX security_alerts_pkey ON public.security_alerts USING btree (id)` |


## Policies (RLS)

### `Admins can delete security_alerts`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(get_user_role() = 'admin'::text)` |
| WITH CHECK |  |

### `Admins can update security_alerts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(get_user_role() = 'admin'::text)` |
| WITH CHECK |  |

### `Admins can view security_alerts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(get_user_role() = 'admin'::text)` |
| WITH CHECK |  |

### `Only admins can insert security_alerts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(get_user_role() = 'admin'::text)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
