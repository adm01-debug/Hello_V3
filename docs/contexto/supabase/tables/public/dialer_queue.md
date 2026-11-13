# public.dialer_queue

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
| 2 | `campaign_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `phone` | `text` | não |  |  |  |
| 5 | `name` | `text` | sim |  |  |  |
| 6 | `priority` | `integer` | não | `0` |  |  |
| 7 | `status` | `text` | não | `'pending'::text` |  |  |
| 8 | `attempts` | `integer` | não | `0` |  |  |
| 9 | `last_attempt_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `next_attempt_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `result` | `text` | sim |  |  |  |
| 12 | `result_notes` | `text` | sim |  |  |  |
| 13 | `assigned_agent` | `text` | sim |  |  |  |
| 14 | `call_duration_seconds` | `integer` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| dialer_queue_campaign_id_fkey | FOREIGN KEY | `FOREIGN KEY (campaign_id) REFERENCES dialer_campaigns(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| dialer_queue_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| dialer_queue_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| dialer_queue_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX dialer_queue_pkey ON public.dialer_queue USING btree (id)` |
| idx_dialer_queue_campaign_id | btree | campaign_id | não | sim |  | `CREATE INDEX idx_dialer_queue_campaign_id ON public.dialer_queue USING btree (campaign_id)` |
| idx_dialer_queue_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_dialer_queue_contact_id ON public.dialer_queue USING btree (contact_id)` |
| idx_dialer_queue_next_attempt | btree | next_attempt_at | não | sim |  | `CREATE INDEX idx_dialer_queue_next_attempt ON public.dialer_queue USING btree (next_attempt_at)` |
| idx_dialer_queue_pending | btree | campaign_id, priority, created_at | não | sim | `(status = 'pending'::text)` | `CREATE INDEX idx_dialer_queue_pending ON public.dialer_queue USING btree (campaign_id, priority DESC, created_at) WHERE (status = 'pending'::text)` |
| idx_dialer_queue_status | btree | status | não | sim |  | `CREATE INDEX idx_dialer_queue_status ON public.dialer_queue USING btree (status)` |


## Policies (RLS)

### `Role-based update dialer_queue`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (assigned_agent = get_user_agent_name()))` |
| WITH CHECK |  |

### `Role-based view dialer_queue`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (assigned_agent = get_user_agent_name()))` |
| WITH CHECK |  |

### `Supervisors can manage dialer_queue`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_dialer_queue_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
