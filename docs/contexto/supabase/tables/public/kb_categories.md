# public.kb_categories

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
| 2 | `name` | `text` | não |  |  |  |
| 3 | `slug` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `icon` | `text` | sim | `'BookOpen'::text` |  |  |
| 6 | `parent_id` | `uuid` | sim |  |  |  |
| 7 | `sort_order` | `integer` | sim | `0` |  |  |
| 8 | `is_published` | `boolean` | sim | `true` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| kb_categories_parent_id_fkey | FOREIGN KEY | `FOREIGN KEY (parent_id) REFERENCES kb_categories(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| kb_categories_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| kb_categories_slug_key | UNIQUE | `UNIQUE (slug)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.kb_articles | kb_articles_category_id_fkey | category_id | SET NULL |
| public.kb_categories | kb_categories_parent_id_fkey | parent_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_kb_categories_parent_id | btree | parent_id | não | sim |  | `CREATE INDEX idx_kb_categories_parent_id ON public.kb_categories USING btree (parent_id)` |
| kb_categories_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX kb_categories_pkey ON public.kb_categories USING btree (id)` |
| kb_categories_slug_key | btree | slug | sim | sim |  | `CREATE UNIQUE INDEX kb_categories_slug_key ON public.kb_categories USING btree (slug)` |


## Policies (RLS)

### `Admin/Supervisor manage kb_categories`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Authenticated read kb_categories`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `((( SELECT auth.uid() AS uid) IS NOT NULL) AND (is_published = true))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_kb_categories_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
