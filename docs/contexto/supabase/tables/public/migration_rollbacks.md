# public.migration_rollbacks

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
| 1 | `id` | `integer` | não | `nextval('migration_rollbacks_id_seq'::regclass)` |  |  |
| 2 | `version` | `character varying(255)` | não |  |  |  |
| 3 | `rolled_back_at` | `timestamp without time zone` | sim | `CURRENT_TIMESTAMP` |  |  |
| 4 | `rolled_back_by` | `character varying(255)` | sim | `CURRENT_USER` |  |  |
| 5 | `reason` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| migration_rollbacks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| migration_rollbacks_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX migration_rollbacks_pkey ON public.migration_rollbacks USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS habilitado **sem policies**: nenhum acesso via API (anon/authenticated).



## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
