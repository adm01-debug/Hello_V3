# public.coaching_recommendations

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
| 2 | `agent_id` | `uuid` | não |  |  |  |
| 3 | `category` | `text` | não |  |  |  |
| 4 | `priority` | `text` | não | `'medium'::text` |  |  |
| 5 | `title` | `text` | não |  |  |  |
| 6 | `description` | `text` | não |  |  |  |
| 7 | `action_items` | `text[]` | sim | `'{}'::text[]` |  |  |
| 8 | `metrics_snapshot` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `status` | `text` | não | `'pending'::text` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `reviewed_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `completed_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| coaching_recommendations_agent_id_fkey | FOREIGN KEY | `FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| coaching_recommendations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| coaching_recommendations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX coaching_recommendations_pkey ON public.coaching_recommendations USING btree (id)` |
| idx_coaching_recommendations_agent_id | btree | agent_id | não | sim |  | `CREATE INDEX idx_coaching_recommendations_agent_id ON public.coaching_recommendations USING btree (agent_id)` |


## Policies (RLS)

### `Role-based update coaching_recommendations`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (agent_id = get_user_agent_id()))` |
| WITH CHECK |  |

### `Role-based view coaching_recommendations`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_admin_or_supervisor() OR (agent_id = get_user_agent_id()))` |
| WITH CHECK |  |

### `Supervisors can delete coaching_recommendations`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Supervisors can insert coaching_recommendations`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
