# public.agents

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
| 2 | `name` | `text` | não |  |  |  |
| 3 | `extension` | `text` | não |  |  |  |
| 4 | `email` | `text` | sim |  |  |  |
| 5 | `status` | `text` | não | `'available'::text` |  |  |
| 6 | `avatar_url` | `text` | sim |  |  |  |
| 7 | `department` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `version` | `integer` | não | `1` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| agents_extension_key | UNIQUE | `UNIQUE (extension)` |  |  | sim |
| agents_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.agent_badges | agent_badges_agent_id_fkey | agent_id | CASCADE |
| public.agent_trunk_assignments | agent_trunk_assignments_agent_id_fkey | agent_id | CASCADE |
| public.agent_weekly_stats | agent_weekly_stats_agent_id_fkey | agent_id | CASCADE |
| public.call_queue_members | call_queue_members_agent_id_fkey | agent_id | CASCADE |
| public.coaching_recommendations | coaching_recommendations_agent_id_fkey | agent_id | CASCADE |
| public.ring_group_members | ring_group_members_agent_id_fkey | agent_id | CASCADE |
| public.shift_swap_suggestions | shift_swap_suggestions_from_agent_id_fkey | from_agent_id | CASCADE |
| public.shift_swap_suggestions | shift_swap_suggestions_to_agent_id_fkey | to_agent_id | CASCADE |
| public.user_profiles | user_profiles_agent_id_fkey | agent_id | NO ACTION |
| public.voip_trunk_usage_metrics | voip_trunk_usage_metrics_agent_id_fkey | agent_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| agents_extension_key | btree | extension | sim | sim |  | `CREATE UNIQUE INDEX agents_extension_key ON public.agents USING btree (extension)` |
| agents_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX agents_pkey ON public.agents USING btree (id)` |


## Policies (RLS)

### `Admins can manage agents`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Agents can view own record, admins/supervisors view all`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (id = get_user_agent_id()))` |
| WITH CHECK |  |

### `Users can view agents`

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
| agents_optimistic_lock | BEFORE | UPDATE | ROW | enabled | public.enforce_optimistic_lock |
| audit_agents_trigger | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.process_audit_log |
| update_agents_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
