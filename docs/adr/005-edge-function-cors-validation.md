# ADR-005: Origin-Validated CORS in Edge Functions

**Status:** Accepted  
**Date:** 2025-04  
**Context:** Edge Functions used `Access-Control-Allow-Origin: *` (wildcard), allowing any origin to make requests.

## Decision

Replace wildcard CORS with origin validation via `buildCorsHeaders(req)` from `_shared/cors.ts`.

### Allowed Origins
- `https://id-preview--*.lovable.app` (preview)
- `https://lovable.dev` (production)
- `http://localhost:8080` / `http://localhost:5173` (development)
- Any `*.lovable.app` subdomain (dynamic previews)

### Implementation
```typescript
import { buildCorsHeaders } from "../_shared/cors.ts";

// In every response:
return new Response(JSON.stringify(data), {
  headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
});
```

## Rationale

- **Prevents CSRF attacks** from unauthorized origins
- **Restricts API access** to known frontend deployments
- **Maintains flexibility** for preview environments via regex matching

## Consequences

- All 30 Edge Functions now use `buildCorsHeaders(req)`
- External API consumers must be explicitly whitelisted
- The deprecated `corsHeaders` constant still exists for backward compatibility but warns against use
