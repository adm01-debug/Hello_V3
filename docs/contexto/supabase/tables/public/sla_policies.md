# public.sla_policies

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
| 5 | `priority` | `text` | sim |  |  |  |
| 6 | `first_response_minutes` | `integer` | não | `60` |  |  |
| 7 | `resolution_minutes` | `integer` | não | `1440` |  |  |
| 8 | `business_hours_only` | `boolean` | sim | `false` |  |  |
| 9 | `is_active` | `boolean` | sim | `true` |  |  |
| 10 | `applies_to_tags` | `text[]` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sla_policies_channel_check | CHECK | `CHECK (channel = ANY (ARRAY['voice'::text, 'whatsapp'::text, 'email'::text, 'chat'::text, 'sms'::text, 'all'::text]))` |  |  | sim |
| sla_policies_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sla_policies_priority_check | CHECK | `CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text, 'all'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sla_policies_active | btree | is_active | não | sim | `(is_active = true)` | `CREATE INDEX idx_sla_policies_active ON public.sla_policies USING btree (is_active) WHERE (is_active = true)` |
| sla_policies_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sla_policies_pkey ON public.sla_policies USING btree (id)` |


## Policies (RLS)

### `Admin manage sla policies`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_user(( SELECT auth.uid() AS uid))` |
| WITH CHECK | `is_admin_user(( SELECT auth.uid() AS uid))` |

### `Authenticated view sla policies`

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
| update_sla_policies_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
