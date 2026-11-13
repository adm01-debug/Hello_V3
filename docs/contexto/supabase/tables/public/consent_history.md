# public.consent_history

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
| 2 | `contact_id` | `uuid` | sim |  |  |  |
| 3 | `phone` | `text` | não |  |  |  |
| 4 | `consent_type` | `text` | não |  |  |  |
| 5 | `consent_given` | `boolean` | não |  |  |  |
| 6 | `consent_method` | `text` | não |  |  |  |
| 7 | `consent_text` | `text` | sim |  |  |  |
| 8 | `ip_address` | `text` | sim |  |  |  |
| 9 | `user_agent` | `text` | sim |  |  |  |
| 10 | `recorded_by` | `text` | sim |  |  |  |
| 11 | `recorded_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `revoked_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| consent_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| consent_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| consent_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX consent_history_pkey ON public.consent_history USING btree (id)` |
| idx_consent_history_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_consent_history_contact_id ON public.consent_history USING btree (contact_id)` |
| idx_consent_phone | btree | phone | não | sim |  | `CREATE INDEX idx_consent_phone ON public.consent_history USING btree (phone)` |


## Policies (RLS)

### `Admins can insert consent_history`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Supervisors can view consent_history`

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
