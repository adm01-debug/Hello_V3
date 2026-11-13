# public.deals

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
| usada por views | public.financial_impact_daily |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `name` | `text` | não |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `owner_agent_name` | `text` | sim |  |  |  |
| 5 | `value_cents` | `bigint` | não | `0` |  |  |
| 6 | `currency` | `text` | não | `'BRL'::text` |  |  |
| 7 | `stage` | `text` | não | `'prospecting'::text` |  |  |
| 8 | `probability` | `numeric(5,2)` | não | `10` |  |  |
| 9 | `expected_close_date` | `date` | sim |  |  |  |
| 10 | `health_score` | `numeric(5,2)` | sim |  |  |  |
| 11 | `health_factors` | `jsonb` | sim |  |  |  |
| 12 | `health_updated_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `status` | `text` | não | `'open'::text` |  |  |
| 14 | `external_id` | `text` | sim |  |  |  |
| 15 | `source` | `text` | sim |  |  |  |
| 16 | `notes` | `text` | sim |  |  |  |
| 17 | `created_by` | `uuid` | sim |  |  |  |
| 18 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 19 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 20 | `version` | `integer` | não | `1` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| deals_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| deals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| deals_probability_check | CHECK | `CHECK (probability >= 0::numeric AND probability <= 100::numeric)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.cadence_enrollments | cadence_enrollments_deal_id_fkey | deal_id | SET NULL |
| public.call_sessions | call_sessions_deal_id_fkey | deal_id | SET NULL |
| public.deal_revenue_snapshots | deal_revenue_snapshots_deal_id_fkey | deal_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| deals_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX deals_pkey ON public.deals USING btree (id)` |
| idx_deals_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_deals_contact_id ON public.deals USING btree (contact_id)` |
| idx_deals_owner | btree | owner_agent_name | não | sim |  | `CREATE INDEX idx_deals_owner ON public.deals USING btree (owner_agent_name)` |
| idx_deals_stage | btree | stage | não | sim |  | `CREATE INDEX idx_deals_stage ON public.deals USING btree (stage)` |
| idx_deals_status | btree | status | não | sim |  | `CREATE INDEX idx_deals_status ON public.deals USING btree (status)` |


## Policies (RLS)

### `Admins/supervisors manage all deals`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Agents update own deals`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(owner_agent_name = get_user_agent_name())` |
| WITH CHECK | `(owner_agent_name = get_user_agent_name())` |

### `Agents view own deals`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `((owner_agent_name = get_user_agent_name()) OR is_admin_or_supervisor())` |
| WITH CHECK |  |

### `Authenticated create deals`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `((( SELECT auth.uid() AS uid) IS NOT NULL) AND (is_admin_or_supervisor() OR (owner_agent_name IS NULL) OR (owner_agent_name = get_user_agent_name())))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| deals_optimistic_lock | BEFORE | UPDATE | ROW | enabled | public.enforce_optimistic_lock |
| trg_deals_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
