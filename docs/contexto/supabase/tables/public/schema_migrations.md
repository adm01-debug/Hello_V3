# public.schema_migrations

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 0 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.migration_status |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `version` | `character varying(255)` | não |  |  |  |
| 2 | `name` | `character varying(255)` | não |  |  |  |
| 3 | `applied_at` | `timestamp without time zone` | sim | `CURRENT_TIMESTAMP` |  |  |
| 4 | `applied_by` | `character varying(255)` | sim | `CURRENT_USER` |  |  |
| 5 | `checksum` | `character varying(64)` | sim |  |  |  |
| 6 | `execution_time_ms` | `integer` | sim |  |  |  |
| 7 | `success` | `boolean` | sim | `true` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| schema_migrations_pkey | PRIMARY KEY | `PRIMARY KEY (version)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| schema_migrations_pkey | btree | version | sim | sim |  | `CREATE UNIQUE INDEX schema_migrations_pkey ON public.schema_migrations USING btree (version)` |


## Policies (RLS)

> ⚠️ RLS habilitado **sem policies**: nenhum acesso via API (anon/authenticated).



## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
