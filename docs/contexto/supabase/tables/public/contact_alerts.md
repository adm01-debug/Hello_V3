# public.contact_alerts

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
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `alert_type` | `text` | não |  |  |  |
| 4 | `severity` | `text` | não | `'info'::text` |  |  |
| 5 | `title` | `text` | não |  |  |  |
| 6 | `message` | `text` | não |  |  |  |
| 7 | `trigger_data` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `is_read` | `boolean` | não | `false` |  |  |
| 9 | `is_actioned` | `boolean` | não | `false` |  |  |
| 10 | `actioned_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `actioned_by` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_alerts_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_alerts_pkey ON public.contact_alerts USING btree (id)` |
| idx_contact_alerts_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_contact_alerts_contact_id ON public.contact_alerts USING btree (contact_id)` |
| idx_contact_alerts_created | btree | created_at | não | sim |  | `CREATE INDEX idx_contact_alerts_created ON public.contact_alerts USING btree (created_at DESC)` |
| idx_contact_alerts_type | btree | alert_type | não | sim |  | `CREATE INDEX idx_contact_alerts_type ON public.contact_alerts USING btree (alert_type)` |
| idx_contact_alerts_unread | btree | is_read | não | sim | `(is_read = false)` | `CREATE INDEX idx_contact_alerts_unread ON public.contact_alerts USING btree (is_read) WHERE (is_read = false)` |


## Policies (RLS)

### `Admins can delete contact_alerts`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Only admins and supervisors can insert contact_alerts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Role-based update contact_alerts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Role-based view contact_alerts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
