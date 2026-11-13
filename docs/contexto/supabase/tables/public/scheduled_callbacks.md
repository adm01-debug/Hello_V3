# public.scheduled_callbacks

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
| 2 | `contact_id` | `uuid` | sim |  |  |  |
| 3 | `caller_name` | `text` | não |  |  |  |
| 4 | `caller_phone` | `text` | não |  |  |  |
| 5 | `scheduled_at` | `timestamp with time zone` | não |  |  |  |
| 6 | `notes` | `text` | sim |  |  |  |
| 7 | `status` | `text` | não | `'pending'::text` |  |  |
| 8 | `priority` | `text` | não | `'normal'::text` |  |  |
| 9 | `assigned_agent` | `text` | sim |  |  |  |
| 10 | `created_by` | `text` | sim |  |  |  |
| 11 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| scheduled_callbacks_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| scheduled_callbacks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_scheduled_callbacks_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_scheduled_callbacks_contact_id ON public.scheduled_callbacks USING btree (contact_id)` |
| idx_scheduled_callbacks_pending | btree | assigned_agent, scheduled_at | não | sim | `(status = 'pending'::text)` | `CREATE INDEX idx_scheduled_callbacks_pending ON public.scheduled_callbacks USING btree (assigned_agent, scheduled_at) WHERE (status = 'pending'::text)` |
| idx_scheduled_callbacks_scheduled_at | btree | scheduled_at | não | sim |  | `CREATE INDEX idx_scheduled_callbacks_scheduled_at ON public.scheduled_callbacks USING btree (scheduled_at)` |
| idx_scheduled_callbacks_status | btree | status | não | sim |  | `CREATE INDEX idx_scheduled_callbacks_status ON public.scheduled_callbacks USING btree (status)` |
| scheduled_callbacks_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX scheduled_callbacks_pkey ON public.scheduled_callbacks USING btree (id)` |


## Policies (RLS)

### `Admins can delete scheduled_callbacks`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Role-based update scheduled_callbacks`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (assigned_agent = get_user_agent_name()) OR (created_by = get_user_agent_name()))` |
| WITH CHECK |  |

### `Role-based view scheduled_callbacks`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (assigned_agent = get_user_agent_name()))` |
| WITH CHECK |  |

### `Supervisors can insert scheduled_callbacks`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_scheduled_callbacks_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
