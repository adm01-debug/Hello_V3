# public.scorecard_criteria

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
| 2 | `template_id` | `uuid` | não |  |  |  |
| 3 | `label` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `weight` | `numeric(5,2)` | não | `1` |  |  |
| 6 | `max_score` | `integer` | não | `5` |  |  |
| 7 | `display_order` | `integer` | não | `0` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| scorecard_criteria_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| scorecard_criteria_template_id_fkey | FOREIGN KEY | `FOREIGN KEY (template_id) REFERENCES scorecard_templates(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.scorecard_responses | scorecard_responses_criterion_id_fkey | criterion_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_scorecard_criteria_template_id | btree | template_id | não | sim |  | `CREATE INDEX idx_scorecard_criteria_template_id ON public.scorecard_criteria USING btree (template_id)` |
| scorecard_criteria_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX scorecard_criteria_pkey ON public.scorecard_criteria USING btree (id)` |


## Policies (RLS)

### `Admins manage criteria`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `All authenticated read criteria`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
