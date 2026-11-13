# public.kb_article_history

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `article_id` | `uuid` | não |  |  |  |
| 3 | `changed_by` | `uuid` | sim |  |  |  |
| 4 | `previous_content` | `text` | sim |  |  |  |
| 5 | `new_content` | `text` | sim |  |  |  |
| 6 | `previous_title` | `text` | sim |  |  |  |
| 7 | `new_title` | `text` | sim |  |  |  |
| 8 | `change_type` | `text` | não |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| kb_article_history_article_id_fkey | FOREIGN KEY | `FOREIGN KEY (article_id) REFERENCES kb_articles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| kb_article_history_changed_by_fkey | FOREIGN KEY | `FOREIGN KEY (changed_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| kb_article_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_kb_article_history_article_id | btree | article_id | não | sim |  | `CREATE INDEX idx_kb_article_history_article_id ON public.kb_article_history USING btree (article_id)` |
| idx_kb_article_history_changed_by | btree | changed_by | não | sim |  | `CREATE INDEX idx_kb_article_history_changed_by ON public.kb_article_history USING btree (changed_by)` |
| kb_article_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX kb_article_history_pkey ON public.kb_article_history USING btree (id)` |


## Policies (RLS)

### `Apenas admin e supervisor veem historico`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
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
