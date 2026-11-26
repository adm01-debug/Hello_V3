# public.client_errors

> Erros nao tratados do navegador (etapa 230 / A-097). Alimentada por src/lib/errorReporter.ts, lida em /admin/client-errors.

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
| 2 | `occurred_at` | `timestamp with time zone` | não | `now()` |  |  |
| 3 | `user_id` | `uuid` | sim |  |  |  |
| 4 | `route` | `text` | não |  |  | pathname da tela onde o erro ocorreu |
| 5 | `error_type` | `text` | não | `'error'::text` |  |  |
| 6 | `message` | `text` | não |  |  |  |
| 7 | `stack` | `text` | sim |  |  |  |
| 8 | `user_agent` | `text` | sim |  |  |  |
| 9 | `correlation_id` | `text` | sim |  |  | trace id do client (src/lib/tracing.ts) para cruzar com logs de edge function |
| 10 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `resolved_by` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| client_errors_correlation_len | CHECK | `CHECK (correlation_id IS NULL OR char_length(correlation_id) <= 100)` |  |  | sim |
| client_errors_message_len | CHECK | `CHECK (char_length(message) >= 1 AND char_length(message) <= 1000)` |  |  | sim |
| client_errors_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| client_errors_resolved_by_fkey | FOREIGN KEY | `FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| client_errors_route_len | CHECK | `CHECK (char_length(route) <= 500)` |  |  | sim |
| client_errors_stack_len | CHECK | `CHECK (stack IS NULL OR char_length(stack) <= 4000)` |  |  | sim |
| client_errors_type_chk | CHECK | `CHECK (error_type = ANY (ARRAY['error'::text, 'unhandled-rejection'::text, 'react-component'::text, 'network-error'::text]))` |  |  | sim |
| client_errors_user_agent_len | CHECK | `CHECK (user_agent IS NULL OR char_length(user_agent) <= 500)` |  |  | sim |
| client_errors_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| client_errors_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX client_errors_pkey ON public.client_errors USING btree (id)` |
| idx_client_errors_occurred_at | btree | occurred_at | não | sim |  | `CREATE INDEX idx_client_errors_occurred_at ON public.client_errors USING btree (occurred_at DESC)` |
| idx_client_errors_open | btree | occurred_at | não | sim | `(resolved_at IS NULL)` | `CREATE INDEX idx_client_errors_open ON public.client_errors USING btree (occurred_at DESC) WHERE (resolved_at IS NULL)` |
| idx_client_errors_route | btree | route, occurred_at | não | sim |  | `CREATE INDEX idx_client_errors_route ON public.client_errors USING btree (route, occurred_at DESC)` |


## Policies (RLS)

### `admins_supervisors_read_client_errors`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `admins_supervisors_resolve_client_errors`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `authenticated_insert_own_client_errors`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
