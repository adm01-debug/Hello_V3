# public.crm_field_suggestions

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
| 2 | `call_session_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `field_name` | `text` | não |  |  |  |
| 5 | `current_value` | `text` | sim |  |  |  |
| 6 | `suggested_value` | `text` | não |  |  |  |
| 7 | `confidence` | `numeric(3,2)` | sim | `0.0` |  |  |
| 8 | `source_quote` | `text` | sim |  |  |  |
| 9 | `status` | `text` | não | `'pending'::text` |  |  |
| 10 | `reviewed_by` | `uuid` | sim |  |  |  |
| 11 | `reviewed_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `applied_value` | `text` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| crm_field_suggestions_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| crm_field_suggestions_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| crm_field_suggestions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| crm_field_suggestions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX crm_field_suggestions_pkey ON public.crm_field_suggestions USING btree (id)` |
| idx_crm_field_suggestions_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_crm_field_suggestions_call_session_id ON public.crm_field_suggestions USING btree (call_session_id)` |
| idx_crm_field_suggestions_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_crm_field_suggestions_contact_id ON public.crm_field_suggestions USING btree (contact_id)` |
| idx_crm_suggestions_status | btree | status | não | sim |  | `CREATE INDEX idx_crm_suggestions_status ON public.crm_field_suggestions USING btree (status)` |


## Policies (RLS)

### `Admin supervisor insert crm suggestions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admin supervisor read crm suggestions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Admin supervisor update crm suggestions`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admin/supervisor deletam sugestões`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_crm_field_suggestions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
