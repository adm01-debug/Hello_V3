# public.contacts

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
| 2 | `external_id` | `text` | sim |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `phone` | `text` | sim |  |  |  |
| 5 | `email` | `text` | sim |  |  |  |
| 6 | `company` | `text` | sim |  |  |  |
| 7 | `position` | `text` | sim |  |  |  |
| 8 | `notes` | `text` | sim |  |  |  |
| 9 | `tags` | `text[]` | sim |  |  |  |
| 10 | `preferences` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `personality_insights` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 12 | `source` | `text` | sim | `'manual'::text` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `account_id` | `uuid` | sim |  |  |  |
| 16 | `version` | `integer` | não | `1` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contacts_account_id_fkey | FOREIGN KEY | `FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| contacts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.cadence_enrollments | cadence_enrollments_contact_id_fkey | contact_id | CASCADE |
| public.call_sessions | call_sessions_contact_id_fkey | contact_id | SET NULL |
| public.consent_history | consent_history_contact_id_fkey | contact_id | CASCADE |
| public.consent_records | consent_records_contact_id_fkey | contact_id | CASCADE |
| public.contact_alerts | contact_alerts_contact_id_fkey | contact_id | CASCADE |
| public.contact_engagement_patterns | contact_engagement_patterns_contact_id_fkey | contact_id | CASCADE |
| public.contact_interactions | contact_interactions_contact_id_fkey | contact_id | CASCADE |
| public.conversations | conversations_contact_id_fkey | contact_id | SET NULL |
| public.crm_field_suggestions | crm_field_suggestions_contact_id_fkey | contact_id | CASCADE |
| public.deals | deals_contact_id_fkey | contact_id | SET NULL |
| public.dialer_queue | dialer_queue_contact_id_fkey | contact_id | SET NULL |
| public.scheduled_callbacks | scheduled_callbacks_contact_id_fkey | contact_id | SET NULL |
| public.survey_responses | survey_responses_contact_id_fkey | contact_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contacts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contacts_pkey ON public.contacts USING btree (id)` |
| idx_contacts_account_id | btree | account_id | não | sim |  | `CREATE INDEX idx_contacts_account_id ON public.contacts USING btree (account_id)` |
| idx_contacts_email | btree | email | não | sim |  | `CREATE INDEX idx_contacts_email ON public.contacts USING btree (email)` |
| idx_contacts_external_id | btree | external_id | não | sim |  | `CREATE INDEX idx_contacts_external_id ON public.contacts USING btree (external_id)` |
| idx_contacts_phone | btree | phone | não | sim |  | `CREATE INDEX idx_contacts_phone ON public.contacts USING btree (phone)` |


## Policies (RLS)

### `Admins can delete contacts`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Role-based update contacts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM contact_interactions ci   WHERE ((ci.contact_id = contacts.id) AND (ci.agent_name = get_user_agent_name())))))` |
| WITH CHECK |  |

### `Role-based view contacts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (EXISTS ( SELECT 1    FROM contact_interactions ci   WHERE ((ci.contact_id = contacts.id) AND (ci.agent_name = get_user_agent_name())))) OR (EXISTS ( SELECT 1    FROM call_sessions cs   WHERE ((cs.contact_id = contacts.id) AND (cs.agent_name = get_user_agent_name())))))` |
| WITH CHECK |  |

### `Supervisors can insert contacts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| audit_contacts_trigger | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.process_audit_log |
| contacts_optimistic_lock | BEFORE | UPDATE | ROW | enabled | public.enforce_optimistic_lock |
| update_contacts_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
