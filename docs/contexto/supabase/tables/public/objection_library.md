# public.objection_library

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
| 2 | `objection_type` | `text` | não |  |  |  |
| 3 | `trigger_keywords` | `text[]` | não | `'{}'::text[]` |  |  |
| 4 | `objection_example` | `text` | não |  |  |  |
| 5 | `recommended_response` | `text` | não |  |  |  |
| 6 | `talking_points` | `text[]` | sim | `'{}'::text[]` |  |  |
| 7 | `category` | `text` | sim |  |  |  |
| 8 | `difficulty` | `text` | sim | `'medium'::text` |  |  |
| 9 | `success_rate` | `numeric(5,2)` | sim | `0.0` |  |  |
| 10 | `times_suggested` | `integer` | sim | `0` |  |  |
| 11 | `times_used` | `integer` | sim | `0` |  |  |
| 12 | `times_won` | `integer` | sim | `0` |  |  |
| 13 | `is_active` | `boolean` | não | `true` |  |  |
| 14 | `created_by` | `uuid` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| objection_library_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_objection_library_keywords | gin | trigger_keywords | não | sim |  | `CREATE INDEX idx_objection_library_keywords ON public.objection_library USING gin (trigger_keywords)` |
| idx_objection_library_type | btree | objection_type | não | sim | `(is_active = true)` | `CREATE INDEX idx_objection_library_type ON public.objection_library USING btree (objection_type) WHERE (is_active = true)` |
| objection_library_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX objection_library_pkey ON public.objection_library USING btree (id)` |


## Policies (RLS)

### `Admin/supervisor gerenciam biblioteca de objeções`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Todos autenticados leem biblioteca de objeções`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_objection_library_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
