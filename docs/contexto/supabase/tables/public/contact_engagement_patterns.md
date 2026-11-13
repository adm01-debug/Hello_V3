# public.contact_engagement_patterns

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
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `best_hour` | `integer` | sim |  |  |  |
| 4 | `best_day_of_week` | `integer` | sim |  |  |  |
| 5 | `answer_rate` | `numeric(5,4)` | sim | `0` |  |  |
| 6 | `total_attempts` | `integer` | não | `0` |  |  |
| 7 | `total_answered` | `integer` | não | `0` |  |  |
| 8 | `avg_call_duration_seconds` | `integer` | sim | `0` |  |  |
| 9 | `hourly_distribution` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 10 | `daily_distribution` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `last_attempt_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `last_answered_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `computed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_engagement_patterns_best_day_of_week_check | CHECK | `CHECK (best_day_of_week >= 0 AND best_day_of_week <= 6)` |  |  | sim |
| contact_engagement_patterns_best_hour_check | CHECK | `CHECK (best_hour >= 0 AND best_hour <= 23)` |  |  | sim |
| contact_engagement_patterns_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_engagement_patterns_contact_id_key | UNIQUE | `UNIQUE (contact_id)` |  |  | sim |
| contact_engagement_patterns_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_engagement_patterns_contact_id_key | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX contact_engagement_patterns_contact_id_key ON public.contact_engagement_patterns USING btree (contact_id)` |
| contact_engagement_patterns_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_engagement_patterns_pkey ON public.contact_engagement_patterns USING btree (id)` |
| idx_contact_engagement_patterns_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_contact_engagement_patterns_contact_id ON public.contact_engagement_patterns USING btree (contact_id)` |
| idx_engagement_patterns_answer_rate | btree | answer_rate | não | sim |  | `CREATE INDEX idx_engagement_patterns_answer_rate ON public.contact_engagement_patterns USING btree (answer_rate DESC)` |


## Policies (RLS)

### `Admins manage engagement patterns`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_user(( SELECT auth.uid() AS uid))` |
| WITH CHECK | `is_admin_user(( SELECT auth.uid() AS uid))` |

### `Authenticated read engagement patterns`

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
| update_engagement_patterns_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
