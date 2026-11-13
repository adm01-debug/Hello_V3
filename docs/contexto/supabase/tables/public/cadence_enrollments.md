# public.cadence_enrollments

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
| 2 | `cadence_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `deal_id` | `uuid` | sim |  |  |  |
| 5 | `agent_name` | `text` | sim |  |  |  |
| 6 | `current_step` | `integer` | não | `0` |  |  |
| 7 | `status` | `text` | não | `'active'::text` |  |  |
| 8 | `next_action_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `paused_reason` | `text` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cadence_enrollments_cadence_id_fkey | FOREIGN KEY | `FOREIGN KEY (cadence_id) REFERENCES cadences(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| cadence_enrollments_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| cadence_enrollments_deal_id_fkey | FOREIGN KEY | `FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| cadence_enrollments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cadence_enrollments_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cadence_enrollments_pkey ON public.cadence_enrollments USING btree (id)` |
| idx_cadence_enrollments_cadence_id | btree | cadence_id | não | sim |  | `CREATE INDEX idx_cadence_enrollments_cadence_id ON public.cadence_enrollments USING btree (cadence_id)` |
| idx_cadence_enrollments_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_cadence_enrollments_contact_id ON public.cadence_enrollments USING btree (contact_id)` |
| idx_cadence_enrollments_deal_id | btree | deal_id | não | sim |  | `CREATE INDEX idx_cadence_enrollments_deal_id ON public.cadence_enrollments USING btree (deal_id)` |
| idx_enrollments_agent | btree | agent_name | não | sim |  | `CREATE INDEX idx_enrollments_agent ON public.cadence_enrollments USING btree (agent_name)` |
| idx_enrollments_next_action | btree | next_action_at | não | sim | `(status = 'active'::text)` | `CREATE INDEX idx_enrollments_next_action ON public.cadence_enrollments USING btree (next_action_at) WHERE (status = 'active'::text)` |


## Policies (RLS)

### `Agents update own enrollments`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `((agent_name = get_user_agent_name()) OR is_admin_or_supervisor())` |
| WITH CHECK | `((agent_name = get_user_agent_name()) OR is_admin_or_supervisor())` |

### `Agents view own enrollments`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `((agent_name = get_user_agent_name()) OR is_admin_or_supervisor())` |
| WITH CHECK |  |

### `Authenticated insert enrollments`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `((( SELECT auth.uid() AS uid) IS NOT NULL) AND (is_admin_or_supervisor() OR (agent_name = get_user_agent_name())))` |

### `Supervisors manage enrollments`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_enrollments_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
