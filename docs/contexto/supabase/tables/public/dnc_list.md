# public.dnc_list

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
| 2 | `phone` | `text` | não |  |  |  |
| 3 | `phone_normalized` | `text` | não |  |  |  |
| 4 | `reason` | `text` | não | `'manual'::text` |  |  |
| 5 | `source` | `text` | não | `'manual'::text` |  |  |
| 6 | `added_by` | `text` | sim |  |  |  |
| 7 | `notes` | `text` | sim |  |  |  |
| 8 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `is_active` | `boolean` | não | `true` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| dnc_list_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| dnc_phone_unique | UNIQUE | `UNIQUE (phone_normalized)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| dnc_list_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX dnc_list_pkey ON public.dnc_list USING btree (id)` |
| dnc_phone_unique | btree | phone_normalized | sim | sim |  | `CREATE UNIQUE INDEX dnc_phone_unique ON public.dnc_list USING btree (phone_normalized)` |
| idx_dnc_active | btree | is_active | não | sim | `(is_active = true)` | `CREATE INDEX idx_dnc_active ON public.dnc_list USING btree (is_active) WHERE (is_active = true)` |
| idx_dnc_list_phone_active | btree | phone_normalized | não | sim | `(is_active = true)` | `CREATE INDEX idx_dnc_list_phone_active ON public.dnc_list USING btree (phone_normalized) WHERE (is_active = true)` |
| idx_dnc_phone_normalized | btree | phone_normalized | não | sim |  | `CREATE INDEX idx_dnc_phone_normalized ON public.dnc_list USING btree (phone_normalized)` |


## Policies (RLS)

### `Authenticated can view dnc_list`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `Supervisors can manage dnc_list`

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
| update_dnc_list_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
