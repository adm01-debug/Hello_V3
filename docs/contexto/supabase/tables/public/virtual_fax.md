# public.virtual_fax

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
| 2 | `direction` | `text` | não | `'outbound'::text` |  |  |
| 3 | `from_number` | `text` | sim |  |  |  |
| 4 | `to_number` | `text` | não |  |  |  |
| 5 | `subject` | `text` | sim |  |  |  |
| 6 | `page_count` | `integer` | não | `0` |  |  |
| 7 | `file_path` | `text` | sim |  |  |  |
| 8 | `status` | `text` | não | `'pending'::text` |  |  |
| 9 | `sent_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `received_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `error_message` | `text` | sim |  |  |  |
| 12 | `created_by` | `text` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `ocr_text` | `text` | sim |  |  |  |
| 15 | `ocr_confidence` | `numeric(4,3)` | sim |  |  |  |
| 16 | `ocr_completed_at` | `timestamp with time zone` | sim |  |  |  |
| 17 | `ocr_search_vector` | `tsvector` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| virtual_fax_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_virtual_fax_ocr_search | gin | ocr_search_vector | não | sim |  | `CREATE INDEX idx_virtual_fax_ocr_search ON public.virtual_fax USING gin (ocr_search_vector)` |
| virtual_fax_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX virtual_fax_pkey ON public.virtual_fax USING btree (id)` |


## Policies (RLS)

### `Admins can manage fax`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Admins can view fax`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Authenticated users can create own fax records`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(created_by = (( SELECT auth.uid() AS uid))::text)` |

### `Users can view own fax records`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (created_by = (( SELECT auth.uid() AS uid))::text))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| virtual_fax_ocr_vector_trg | BEFORE | INSERT OR UPDATE | ROW | enabled | public.update_virtual_fax_ocr_vector |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
