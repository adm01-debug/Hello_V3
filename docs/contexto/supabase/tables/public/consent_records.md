# public.consent_records

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
| 2 | `contact_id` | `uuid` | sim |  |  |  |
| 3 | `phone` | `text` | sim |  |  |  |
| 4 | `channel` | `text` | não |  |  |  |
| 5 | `consent_type` | `text` | não |  |  |  |
| 6 | `granted` | `boolean` | não | `true` |  |  |
| 7 | `granted_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `revoked_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `source` | `text` | não | `'manual'::text` |  |  |
| 10 | `evidence` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `recorded_by` | `text` | sim |  |  |  |
| 12 | `ip_address` | `text` | sim |  |  |  |
| 13 | `user_agent` | `text` | sim |  |  |  |
| 14 | `notes` | `text` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| consent_records_channel_check | CHECK | `CHECK (channel = ANY (ARRAY['voice'::text, 'sms'::text, 'whatsapp'::text, 'email'::text]))` |  |  | sim |
| consent_records_consent_type_check | CHECK | `CHECK (consent_type = ANY (ARRAY['marketing'::text, 'transactional'::text, 'recording'::text, 'data_processing'::text]))` |  |  | sim |
| consent_records_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| consent_records_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| consent_records_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX consent_records_pkey ON public.consent_records USING btree (id)` |
| idx_consent_records_channel_type | btree | channel, consent_type | não | sim |  | `CREATE INDEX idx_consent_records_channel_type ON public.consent_records USING btree (channel, consent_type)` |
| idx_consent_records_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_consent_records_contact_id ON public.consent_records USING btree (contact_id)` |
| idx_consent_records_granted | btree | granted | não | sim | `(granted = true)` | `CREATE INDEX idx_consent_records_granted ON public.consent_records USING btree (granted) WHERE (granted = true)` |
| idx_consent_records_phone | btree | phone | não | sim |  | `CREATE INDEX idx_consent_records_phone ON public.consent_records USING btree (phone)` |


## Policies (RLS)

### `Admins delete consent`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_user(( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `Admins/supervisors insert consent`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `is_admin_or_supervisor()` |

### `Admins/supervisors update consent`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `is_admin_or_supervisor()` |
| WITH CHECK |  |

### `Admins/supervisors view consent`

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
| update_consent_records_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
