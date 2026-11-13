# public.time_off_requests

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
| 2 | `agent_name` | `text` | não |  |  |  |
| 3 | `requested_by` | `uuid` | sim |  |  |  |
| 4 | `start_date` | `date` | não |  |  |  |
| 5 | `end_date` | `date` | não |  |  |  |
| 6 | `request_type` | `text` | não | `'vacation'::text` |  |  |
| 7 | `reason` | `text` | sim |  |  |  |
| 8 | `status` | `text` | não | `'pending'::text` |  |  |
| 9 | `reviewed_by` | `uuid` | sim |  |  |  |
| 10 | `reviewer_notes` | `text` | sim |  |  |  |
| 11 | `reviewed_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| time_off_requests_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_time_off_agent | btree | agent_name | não | sim |  | `CREATE INDEX idx_time_off_agent ON public.time_off_requests USING btree (agent_name)` |
| idx_time_off_status | btree | status | não | sim |  | `CREATE INDEX idx_time_off_status ON public.time_off_requests USING btree (status)` |
| time_off_requests_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX time_off_requests_pkey ON public.time_off_requests USING btree (id)` |


## Policies (RLS)

### `Admin/supervisor delete time off`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Admin/supervisor manage time off`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Agents create own time off`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((get_user_agent_name() = agent_name) OR is_admin_or_supervisor())` |

### `Agents view own time off`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (get_user_agent_name() = agent_name))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_time_off_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
