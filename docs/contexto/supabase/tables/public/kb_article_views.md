# public.kb_article_views

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
| 2 | `article_id` | `uuid` | não |  |  |  |
| 3 | `viewer_id` | `uuid` | sim |  |  |  |
| 4 | `viewer_type` | `text` | sim | `'agent'::text` |  |  |
| 5 | `conversation_id` | `uuid` | sim |  |  |  |
| 6 | `was_helpful` | `boolean` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| kb_article_views_article_id_fkey | FOREIGN KEY | `FOREIGN KEY (article_id) REFERENCES kb_articles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| kb_article_views_conversation_id_fkey | FOREIGN KEY | `FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| kb_article_views_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| kb_article_views_viewer_type_check | CHECK | `CHECK (viewer_type = ANY (ARRAY['agent'::text, 'visitor'::text, 'bot'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_kb_article_views_article_id | btree | article_id | não | sim |  | `CREATE INDEX idx_kb_article_views_article_id ON public.kb_article_views USING btree (article_id)` |
| idx_kb_article_views_conversation_id | btree | conversation_id | não | sim |  | `CREATE INDEX idx_kb_article_views_conversation_id ON public.kb_article_views USING btree (conversation_id)` |
| idx_kb_views_created | btree | created_at | não | sim |  | `CREATE INDEX idx_kb_views_created ON public.kb_article_views USING btree (created_at DESC)` |
| kb_article_views_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX kb_article_views_pkey ON public.kb_article_views USING btree (id)` |


## Policies (RLS)

### `Admin/Supervisor view all kb views`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Agents insert own kb views`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((viewer_type = 'agent'::text) AND (viewer_id = ( SELECT auth.uid() AS uid)))` |

### `Agents view own kb_article_views`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(viewer_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
