# Storage

Policies de `storage.objects`/`storage.buckets` em `policies.md`. Contagens em `stats.md`.

| bucket | público | limite por arquivo | mime permitidos | criado em |
|---|---|---|---|---|
| call-recordings | não |  |  | 2026-09-11 13:16:02.246518+00:00 |
| data-lake-exports | não |  |  | 2026-09-11 13:16:02.246518+00:00 |
| queue-audio | não |  |  | 2026-09-11 13:16:02.246518+00:00 |
| virtual-fax-docs | não |  |  | 2026-09-11 13:16:02.246518+00:00 |

## Configuração (Management API)

```json
{
  "capabilities": {
    "iceberg_catalog": true,
    "list_v2": true,
    "object_versioning": false
  },
  "external": {
    "upstreamTarget": "canary"
  },
  "features": {
    "icebergCatalog": {
      "enabled": false,
      "maxCatalogs": 2,
      "maxNamespaces": 10,
      "maxTables": 10
    },
    "imageTransformation": {
      "enabled": false
    },
    "purgeCache": {
      "enabled": false
    },
    "s3Protocol": {
      "enabled": true
    },
    "vectorBuckets": {
      "enabled": false,
      "maxBuckets": 10,
      "maxIndexes": 5
    }
  },
  "fileSizeLimit": 52428800,
  "migrationVersion": "revoke-extra-lifecycle-postgres-grants"
}
```
