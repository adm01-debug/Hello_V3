# public.survey_responses

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
| 2 | `survey_id` | `uuid` | não |  |  |  |
| 3 | `account_id` | `uuid` | sim |  |  |  |
| 4 | `contact_id` | `uuid` | sim |  |  |  |
| 5 | `call_session_id` | `uuid` | sim |  |  |  |
| 6 | `respondent_email` | `text` | sim |  |  |  |
| 7 | `respondent_phone` | `text` | sim |  |  |  |
| 8 | `score` | `integer` | sim |  |  |  |
| 9 | `category` | `text` | sim |  |  |  |
| 10 | `answers` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 11 | `free_text_feedback` | `text` | sim |  |  |  |
| 12 | `channel` | `text` | sim | `'in_app'::text` |  |  |
| 13 | `submitted_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| survey_responses_account_id_fkey | FOREIGN KEY | `FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| survey_responses_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| survey_responses_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| survey_responses_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| survey_responses_survey_id_fkey | FOREIGN KEY | `FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_survey_responses_account_id | btree | account_id | não | sim |  | `CREATE INDEX idx_survey_responses_account_id ON public.survey_responses USING btree (account_id)` |
| idx_survey_responses_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_survey_responses_call_session_id ON public.survey_responses USING btree (call_session_id)` |
| idx_survey_responses_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_survey_responses_contact_id ON public.survey_responses USING btree (contact_id)` |
| idx_survey_responses_survey_id | btree | survey_id | não | sim |  | `CREATE INDEX idx_survey_responses_survey_id ON public.survey_responses USING btree (survey_id)` |
| survey_responses_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX survey_responses_pkey ON public.survey_responses USING btree (id)` |


## Policies (RLS)

### `Admin/Supervisor insert survey_responses`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admin/supervisor or CSM insert survey responses`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(is_admin_or_supervisor() OR (account_id IS NULL) OR (EXISTS ( SELECT 1    FROM accounts a   WHERE ((a.id = survey_responses.account_id) AND (a.csm_agent_name = get_user_agent_name())))))` |

### `Admin/supervisor view all responses`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `CSM views responses for their accounts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM accounts a   WHERE ((a.id = survey_responses.account_id) AND (a.csm_agent_name = get_user_agent_name()))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
