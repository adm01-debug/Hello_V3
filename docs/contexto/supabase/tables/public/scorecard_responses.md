# public.scorecard_responses

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
| 2 | `scorecard_id` | `uuid` | não |  |  |  |
| 3 | `criterion_id` | `uuid` | não |  |  |  |
| 4 | `score` | `numeric(5,2)` | não |  |  |  |
| 5 | `comment` | `text` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| scorecard_responses_criterion_id_fkey | FOREIGN KEY | `FOREIGN KEY (criterion_id) REFERENCES scorecard_criteria(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| scorecard_responses_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| scorecard_responses_scorecard_id_fkey | FOREIGN KEY | `FOREIGN KEY (scorecard_id) REFERENCES call_scorecards(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_scorecard_responses_criterion_id | btree | criterion_id | não | sim |  | `CREATE INDEX idx_scorecard_responses_criterion_id ON public.scorecard_responses USING btree (criterion_id)` |
| idx_scorecard_responses_scorecard_id | btree | scorecard_id | não | sim |  | `CREATE INDEX idx_scorecard_responses_scorecard_id ON public.scorecard_responses USING btree (scorecard_id)` |
| scorecard_responses_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX scorecard_responses_pkey ON public.scorecard_responses USING btree (id)` |


## Policies (RLS)

### `Supervisors manage responses`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `View responses for accessible scorecards`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(EXISTS ( SELECT 1    FROM call_scorecards cs   WHERE ((cs.id = scorecard_responses.scorecard_id) AND ((cs.agent_name = get_user_agent_name()) OR is_admin_or_supervisor()))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
