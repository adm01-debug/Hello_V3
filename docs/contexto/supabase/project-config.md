# Configuração do projeto (Management API, segredos redigidos)

| campo | valor |
|---|---|
| projeto | Hello_V3 |
| região | us-east-2 |
| URL | https://cfmlmcdyjuotqobjapng.supabase.co |
| schemas expostos (PostgREST) | public,graphql_public |
| max_rows (PostgREST) | 1000 |
| extra_search_path | public, extensions |
| PITR | não |
| branches | 1 |

```json
{
  "backups_config": {
    "pitr_enabled": false,
    "region": "us-east-2",
    "walg_enabled": true
  },
  "branches": [
    {
      "git_branch": "main",
      "id": "80aff264-97a3-4b39-a4dd-e74251775c80",
      "is_default": true,
      "name": "main",
      "persistent": false,
      "status": "FUNCTIONS_DEPLOYED"
    }
  ],
  "custom_hostname": null,
  "network_restrictions": {
    "config": {
      "dbAllowedCidrs": [
        "0.0.0.0/0"
      ],
      "dbAllowedCidrsV6": [
        "::/0"
      ]
    },
    "entitlement": "allowed",
    "status": "applied"
  },
  "pooler_config": [
    {
      "connectionString": "postgresql://postgres.cfmlmcdyjuotqobjapng:[REDACTED]@aws-0-us-east-2.pooler.supabase.com:6543/postgres",
      "connection_string": "[REDACTED]",
      "database_type": "PRIMARY",
      "db_host": "aws-0-us-east-2.pooler.supabase.com",
      "db_name": "postgres",
      "db_port": 6543,
      "db_user": "postgres.cfmlmcdyjuotqobjapng",
      "default_pool_size": null,
      "identifier": "cfmlmcdyjuotqobjapng",
      "is_using_scram_auth": true,
      "max_client_conn": null,
      "pool_mode": "transaction"
    }
  ],
  "postgres_config": {},
  "postgrest_config": {
    "db_extra_search_path": "public, extensions",
    "db_pool": null,
    "db_pool_acquisition_timeout": 10,
    "db_pool_max_idletime": 30,
    "db_pool_max_lifetime": 1800,
    "db_schema": "public,graphql_public",
    "jwt_secret": "[REDACTED]",
    "max_rows": 1000
  },
  "project": {
    "created_at": "2026-07-24T16:10:14.832447Z",
    "id": "cfmlmcdyjuotqobjapng",
    "name": "Hello_V3",
    "organization_id": "ociubxjrvookukkejdfm",
    "region": "us-east-2",
    "status": "ACTIVE_HEALTHY"
  },
  "ssl_enforcement": {
    "appliedSuccessfully": true,
    "currentConfig": {
      "database": false
    }
  },
  "url": "https://cfmlmcdyjuotqobjapng.supabase.co"
}
```
