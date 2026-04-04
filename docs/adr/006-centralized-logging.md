# ADR-006: Centralized Structured Logger with Request ID

**Status:** Accepted  
**Date:** 2025-04  
**Context:** Debugging cross-service issues requires correlating logs across frontend and Edge Functions.

## Decision

Enhance the centralized logger (`src/lib/logger.ts`) with request ID correlation:

```typescript
import { logger, generateRequestId, setRequestId, withRequestId } from '@/lib/logger';

// Auto-correlate logs within a scope
withRequestId(() => {
  logger.info('Starting operation');     // [rid:a1b2c3d4e5f6]
  logger.info('Operation complete');     // [rid:a1b2c3d4e5f6]
});

// Or manually set for API calls
const rid = generateRequestId();
setRequestId(rid);
// Pass rid in X-Request-ID header to Edge Functions
```

### Log Format
```
2025-04-04T12:00:00.000Z [INFO][Auth][rid:a1b2c3d4e5f6] User logged in
```

## Rationale

- **Trace causality** — correlate frontend actions with backend processing
- **Debug production issues** — filter logs by request ID
- **Zero external dependencies** — uses crypto.getRandomValues

## Consequences

- Request IDs are optional — existing code continues to work unchanged
- Edge Functions should read `X-Request-ID` header and include in their logs
- PII masking still applies to all log data
