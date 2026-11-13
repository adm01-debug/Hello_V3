# public.cultural_hints

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
| 2 | `locale` | `text` | não |  |  |  |
| 3 | `context_type` | `text` | não |  |  |  |
| 4 | `hint_text` | `text` | não |  |  |  |
| 5 | `severity` | `text` | não | `'info'::text` |  |  |
| 6 | `is_active` | `boolean` | não | `true` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cultural_hints_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| cultural_hints_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cultural_hints_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cultural_hints_pkey ON public.cultural_hints USING btree (id)` |
| idx_cultural_hints_locale | btree | locale, is_active | não | sim |  | `CREATE INDEX idx_cultural_hints_locale ON public.cultural_hints USING btree (locale, is_active)` |


## Policies (RLS)

### `Admin can manage cultural hints`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_user(( SELECT auth.uid() AS uid))` |
| WITH CHECK | `is_admin_user(( SELECT auth.uid() AS uid))` |

### `Authenticated can view cultural hints`

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
| update_cultural_hints_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
