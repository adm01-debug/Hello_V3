# public.routing_rules

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
| 4 | `channel` | `text` | sim |  |  |  |
| 5 | `conditions` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 6 | `actions` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 7 | `priority` | `integer` | não | `100` |  |  |
| 8 | `is_active` | `boolean` | sim | `true` |  |  |
| 9 | `match_count` | `integer` | sim | `0` |  |  |
| 10 | `last_matched_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `created_by` | `uuid` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| routing_rules_channel_check | CHECK | `CHECK (channel = ANY (ARRAY['voice'::text, 'whatsapp'::text, 'email'::text, 'chat'::text, 'sms'::text, 'all'::text]))` |  |  | sim |
| routing_rules_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_routing_rules_active_priority | btree | is_active, priority | não | sim | `(is_active = true)` | `CREATE INDEX idx_routing_rules_active_priority ON public.routing_rules USING btree (is_active, priority) WHERE (is_active = true)` |
| routing_rules_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX routing_rules_pkey ON public.routing_rules USING btree (id)` |


## Policies (RLS)

### `Admin manage routing rules`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_user(( SELECT auth.uid() AS uid))` |
| WITH CHECK | `is_admin_user(( SELECT auth.uid() AS uid))` |

### `Admin/Supervisor view routing rules`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_routing_rules_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
