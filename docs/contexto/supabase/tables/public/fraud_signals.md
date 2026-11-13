# public.fraud_signals

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
| 2 | `call_session_id` | `uuid` | não |  |  |  |
| 3 | `agent_name` | `text` | sim |  |  |  |
| 4 | `signal_type` | `text` | não |  |  |  |
| 5 | `risk_score` | `integer` | não | `0` |  |  |
| 6 | `severity` | `text` | não | `'low'::text` |  |  |
| 7 | `evidence` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 8 | `description` | `text` | sim |  |  |  |
| 9 | `status` | `text` | não | `'open'::text` |  |  |
| 10 | `reviewed_by` | `uuid` | sim |  |  |  |
| 11 | `reviewed_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `resolution_notes` | `text` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| fraud_signals_call_session_id_fkey | FOREIGN KEY | `FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| fraud_signals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| fraud_signals_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX fraud_signals_pkey ON public.fraud_signals USING btree (id)` |
| idx_fraud_signals_call_session_id | btree | call_session_id | não | sim |  | `CREATE INDEX idx_fraud_signals_call_session_id ON public.fraud_signals USING btree (call_session_id)` |
| idx_fraud_signals_severity | btree | severity, created_at | não | sim |  | `CREATE INDEX idx_fraud_signals_severity ON public.fraud_signals USING btree (severity, created_at DESC)` |
| idx_fraud_signals_status | btree | status | não | sim | `(status = 'open'::text)` | `CREATE INDEX idx_fraud_signals_status ON public.fraud_signals USING btree (status) WHERE (status = 'open'::text)` |


## Policies (RLS)

### `Admins and supervisors view all fraud signals`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Admins manage fraud signals`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_user(( SELECT auth.uid() AS uid))` |
| WITH CHECK | `is_admin_user(( SELECT auth.uid() AS uid))` |

### `Agents view fraud signals on own calls`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(agent_name = get_user_agent_name())` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_fraud_signals_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
