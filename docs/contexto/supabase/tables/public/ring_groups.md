# public.ring_groups

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
| 2 | `name` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `extension` | `text` | sim |  |  |  |
| 5 | `is_active` | `boolean` | não | `true` |  |  |
| 6 | `strategy` | `text` | não | `'ringall'::text` |  |  |
| 7 | `ring_timeout_seconds` | `integer` | não | `25` |  |  |
| 8 | `step_timeout_seconds` | `integer` | não | `15` |  |  |
| 9 | `no_answer_action` | `text` | não | `'voicemail'::text` |  |  |
| 10 | `forward_target` | `text` | sim |  |  |  |
| 11 | `skip_busy_agents` | `boolean` | não | `true` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ring_groups_description_check | CHECK | `CHECK (description IS NULL OR char_length(description) <= 500)` |  |  | sim |
| ring_groups_extension_check | CHECK | `CHECK (extension IS NULL OR extension ~ '^[0-9*#+]{1,20}$'::text)` |  |  | sim |
| ring_groups_forward_target_check | CHECK | `CHECK (forward_target IS NULL OR char_length(forward_target) <= 120)` |  |  | sim |
| ring_groups_name_check | CHECK | `CHECK (char_length(btrim(name)) >= 1 AND char_length(btrim(name)) <= 120)` |  |  | sim |
| ring_groups_no_answer_action_check | CHECK | `CHECK (no_answer_action = ANY (ARRAY['voicemail'::text, 'forward_extension'::text, 'forward_queue'::text, 'hangup'::text]))` |  |  | sim |
| ring_groups_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| ring_groups_ring_timeout_seconds_check | CHECK | `CHECK (ring_timeout_seconds >= 5 AND ring_timeout_seconds <= 300)` |  |  | sim |
| ring_groups_step_timeout_seconds_check | CHECK | `CHECK (step_timeout_seconds >= 5 AND step_timeout_seconds <= 120)` |  |  | sim |
| ring_groups_strategy_check | CHECK | `CHECK (strategy = ANY (ARRAY['ringall'::text, 'sequential'::text, 'roundrobin'::text, 'random'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.ring_group_members | ring_group_members_group_id_fkey | group_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_ring_groups_active | btree | is_active | não | sim |  | `CREATE INDEX idx_ring_groups_active ON public.ring_groups USING btree (is_active)` |
| idx_ring_groups_name | btree |  | não | sim |  | `CREATE INDEX idx_ring_groups_name ON public.ring_groups USING btree (lower(name))` |
| ring_groups_extension_key | btree | extension | sim | sim | `(extension IS NOT NULL)` | `CREATE UNIQUE INDEX ring_groups_extension_key ON public.ring_groups USING btree (extension) WHERE (extension IS NOT NULL)` |
| ring_groups_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX ring_groups_pkey ON public.ring_groups USING btree (id)` |


## Policies (RLS)

### `ring_groups_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `ring_groups_write_staff`

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
| trg_ring_groups_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_validate_ring_group | BEFORE | INSERT OR UPDATE | ROW | enabled | public.validate_ring_group |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
