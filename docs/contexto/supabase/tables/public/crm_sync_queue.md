# public.crm_sync_queue

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `action` | `text` | não |  |  |  |
| 3 | `payload` | `jsonb` | não |  |  |  |
| 4 | `status` | `text` | não | `'pending'::text` |  |  |
| 5 | `attempts` | `integer` | não | `0` |  |  |
| 6 | `max_attempts` | `integer` | não | `5` |  |  |
| 7 | `last_error` | `text` | sim |  |  |  |
| 8 | `next_retry_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `requested_by` | `uuid` | sim | `auth.uid()` |  | Autor do item da fila. DEFAULT auth.uid(): quem insere pela sessao fica amarrado automaticamente (etapa 084). NULL quando a origem e service_role/cron. |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| crm_sync_queue_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| crm_sync_queue_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX crm_sync_queue_pkey ON public.crm_sync_queue USING btree (id)` |
| idx_crm_sync_queue_requested_by | btree | requested_by | não | sim |  | `CREATE INDEX idx_crm_sync_queue_requested_by ON public.crm_sync_queue USING btree (requested_by)` |
| idx_crm_sync_queue_status_retry | btree | status, next_retry_at | não | sim | `(status = ANY (ARRAY['pending'::text, 'failed'::text]))` | `CREATE INDEX idx_crm_sync_queue_status_retry ON public.crm_sync_queue USING btree (status, next_retry_at) WHERE (status = ANY (ARRAY['pending'::text, 'failed'::text]))` |


## Policies (RLS)

### `Admin supervisor insert crm sync queue`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admin supervisor update crm sync queue`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admins e supervisores podem ler fila CRM`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Agente enfileira a propria acao`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(requested_by = auth.uid())` |

### `Agente le a propria acao`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(requested_by = auth.uid())` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_crm_sync_queue_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
