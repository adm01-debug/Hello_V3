# public.call_scorecards

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
| 2 | `call_session_id` | `uuid` | não |  |  |  |
| 3 | `template_id` | `uuid` | não |  |  |  |
| 4 | `agent_name` | `text` | sim |  |  |  |
| 5 | `reviewer_id` | `uuid` | sim |  |  |  |
| 6 | `reviewer_email` | `text` | sim |  |  |  |
| 7 | `total_score` | `numeric(6,2)` | sim |  |  |  |
| 8 | `max_total` | `numeric(6,2)` | sim |  |  |  |
| 9 | `status` | `text` | não | `'draft'::text` |  |  |
| 10 | `ai_generated` | `boolean` | não | `false` |  |  |
| 11 | `feedback` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| call_scorecards_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| call_scorecards_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| call_scorecards_template_id_fkey | FOREIGN KEY | `FOREIGN KEY (template_id) REFERENCES scorecard_templates(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.scorecard_responses | scorecard_responses_scorecard_id_fkey | scorecard_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| call_scorecards_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX call_scorecards_pkey ON public.call_scorecards USING btree (id)` |
| idx_call_scorecards_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_call_scorecards_call_session_id ON public.call_scorecards USING btree (call_session_id)` |
| idx_call_scorecards_template_id | btree | template_id | não | sim |  | `CREATE INDEX idx_call_scorecards_template_id ON public.call_scorecards USING btree (template_id)` |
| idx_scorecards_agent | btree | agent_name | não | sim |  | `CREATE INDEX idx_scorecards_agent ON public.call_scorecards USING btree (agent_name)` |


## Policies (RLS)

### `Agents view own scorecards`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `((agent_name = get_user_agent_name()) OR is_admin_or_supervisor())` |
| WITH CHECK |  |

### `Supervisors manage scorecards`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_call_scorecards_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
