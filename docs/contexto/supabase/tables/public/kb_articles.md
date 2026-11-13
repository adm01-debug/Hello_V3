# public.kb_articles

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
| 2 | `category_id` | `uuid` | sim |  |  |  |
| 3 | `title` | `text` | não |  |  |  |
| 4 | `slug` | `text` | não |  |  |  |
| 5 | `content` | `text` | não |  |  |  |
| 6 | `excerpt` | `text` | sim |  |  |  |
| 7 | `tags` | `text[]` | sim | `ARRAY[]::text[]` |  |  |
| 8 | `status` | `text` | não | `'draft'::text` |  |  |
| 9 | `view_count` | `integer` | sim | `0` |  |  |
| 10 | `helpful_count` | `integer` | sim | `0` |  |  |
| 11 | `not_helpful_count` | `integer` | sim | `0` |  |  |
| 12 | `author_email` | `text` | sim |  |  |  |
| 13 | `search_vector` | `tsvector` | sim |  |  |  |
| 14 | `published_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `embedding` | `vector` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| kb_articles_category_id_fkey | FOREIGN KEY | `FOREIGN KEY (category_id) REFERENCES kb_categories(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| kb_articles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| kb_articles_slug_key | UNIQUE | `UNIQUE (slug)` |  |  | sim |
| kb_articles_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.kb_article_history | kb_article_history_article_id_fkey | article_id | CASCADE |
| public.kb_article_views | kb_article_views_article_id_fkey | article_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_kb_articles_category_id | btree | category_id | não | sim |  | `CREATE INDEX idx_kb_articles_category_id ON public.kb_articles USING btree (category_id)` |
| idx_kb_articles_search | gin | search_vector | não | sim |  | `CREATE INDEX idx_kb_articles_search ON public.kb_articles USING gin (search_vector)` |
| idx_kb_articles_status | btree | status | não | sim |  | `CREATE INDEX idx_kb_articles_status ON public.kb_articles USING btree (status)` |
| idx_kb_articles_tags | gin | tags | não | sim |  | `CREATE INDEX idx_kb_articles_tags ON public.kb_articles USING gin (tags)` |
| kb_articles_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX kb_articles_pkey ON public.kb_articles USING btree (id)` |
| kb_articles_slug_key | btree | slug | sim | sim |  | `CREATE UNIQUE INDEX kb_articles_slug_key ON public.kb_articles USING btree (slug)` |


## Policies (RLS)

### `Admin/Supervisor manage articles`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admin/Supervisor view all articles`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Authenticated read published articles`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `((( SELECT auth.uid() AS uid) IS NOT NULL) AND (status = 'published'::text))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| kb_article_history_trigger | AFTER | INSERT OR UPDATE | ROW | enabled | public.handle_kb_article_history |
| kb_articles_search_vector_trigger | BEFORE | INSERT OR UPDATE | ROW | enabled | public.update_kb_article_search_vector |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
