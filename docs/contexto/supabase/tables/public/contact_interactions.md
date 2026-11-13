# public.contact_interactions

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
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `call_session_id` | `uuid` | sim |  |  |  |
| 4 | `interaction_type` | `text` | não | `'call'::text` |  |  |
| 5 | `direction` | `text` | sim |  |  |  |
| 6 | `summary` | `text` | sim |  |  |  |
| 7 | `transcript` | `text` | sim |  |  |  |
| 8 | `sentiment` | `text` | sim |  |  |  |
| 9 | `topics` | `text[]` | sim |  |  |  |
| 10 | `duration_seconds` | `integer` | sim |  |  |  |
| 11 | `agent_name` | `text` | sim |  |  |  |
| 12 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_interactions_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| contact_interactions_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_interactions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_interactions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_interactions_pkey ON public.contact_interactions USING btree (id)` |
| idx_contact_interactions_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_contact_interactions_call_session_id ON public.contact_interactions USING btree (call_session_id)` |
| idx_contact_interactions_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_contact_interactions_contact_id ON public.contact_interactions USING btree (contact_id)` |
| idx_contact_interactions_created | btree | created_at | não | sim |  | `CREATE INDEX idx_contact_interactions_created ON public.contact_interactions USING btree (created_at DESC)` |
| idx_contact_interactions_type | btree | interaction_type | não | sim |  | `CREATE INDEX idx_contact_interactions_type ON public.contact_interactions USING btree (interaction_type)` |


## Policies (RLS)

### `Admins can manage contact_interactions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Agents can insert own interactions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(is_admin_or_supervisor() OR is_active_agent(agent_name))` |

### `Role-based view contact_interactions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR ((agent_name = get_user_agent_name()) AND is_active_agent(agent_name)))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_interactions_recalc_deals | AFTER | INSERT | ROW | enabled | public.trg_recalc_deals_on_interaction |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
