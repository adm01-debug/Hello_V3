# public.shift_swap_suggestions

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
| 2 | `from_agent_id` | `uuid` | não |  |  |  |
| 3 | `to_agent_id` | `uuid` | não |  |  |  |
| 4 | `from_shift_id` | `uuid` | sim |  |  |  |
| 5 | `to_shift_id` | `uuid` | sim |  |  |  |
| 6 | `score` | `numeric(5,2)` | não |  |  |  |
| 7 | `reason` | `text` | não |  |  |  |
| 8 | `status` | `text` | não | `'pending'::text` |  |  |
| 9 | `approved_by` | `uuid` | sim |  |  |  |
| 10 | `approved_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| shift_swap_suggestions_from_agent_id_fkey | FOREIGN KEY | `FOREIGN KEY (from_agent_id) REFERENCES agents(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| shift_swap_suggestions_from_shift_id_fkey | FOREIGN KEY | `FOREIGN KEY (from_shift_id) REFERENCES agent_shifts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| shift_swap_suggestions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| shift_swap_suggestions_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'expired'::text]))` |  |  | sim |
| shift_swap_suggestions_to_agent_id_fkey | FOREIGN KEY | `FOREIGN KEY (to_agent_id) REFERENCES agents(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| shift_swap_suggestions_to_shift_id_fkey | FOREIGN KEY | `FOREIGN KEY (to_shift_id) REFERENCES agent_shifts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_shift_swap_status | btree | status, created_at | não | sim |  | `CREATE INDEX idx_shift_swap_status ON public.shift_swap_suggestions USING btree (status, created_at DESC)` |
| idx_shift_swap_suggestions_from_agent_id | btree | from_agent_id | não | sim |  | `CREATE INDEX idx_shift_swap_suggestions_from_agent_id ON public.shift_swap_suggestions USING btree (from_agent_id)` |
| idx_shift_swap_suggestions_from_shift_id | btree | from_shift_id | não | sim |  | `CREATE INDEX idx_shift_swap_suggestions_from_shift_id ON public.shift_swap_suggestions USING btree (from_shift_id)` |
| idx_shift_swap_suggestions_to_agent_id | btree | to_agent_id | não | sim |  | `CREATE INDEX idx_shift_swap_suggestions_to_agent_id ON public.shift_swap_suggestions USING btree (to_agent_id)` |
| idx_shift_swap_suggestions_to_shift_id | btree | to_shift_id | não | sim |  | `CREATE INDEX idx_shift_swap_suggestions_to_shift_id ON public.shift_swap_suggestions USING btree (to_shift_id)` |
| shift_swap_suggestions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX shift_swap_suggestions_pkey ON public.shift_swap_suggestions USING btree (id)` |


## Policies (RLS)

### `Admin/Supervisor manage shift swaps`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| shift_swap_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
