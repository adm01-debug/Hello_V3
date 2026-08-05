# ADR-007: Lazy Routing and Bundle Code Splitting

**Status:** Accepted  
**Date:** 2025-03  
**Context:** With 52+ protected routes and heavy dependencies (Recharts, Framer Motion), the initial bundle was 866KB.

## Decision

1. **All routes use `React.lazy()`** with `Suspense` fallback
2. **Vendor chunks** are split via `manualChunks` in Vite config:
   - `vendor-react` — React core (37KB gzip)
   - `vendor-ui` — Radix UI components (77KB gzip)
   - `vendor-charts` — Recharts (117KB gzip, loaded on demand)
   - `vendor-motion` — Framer Motion (41KB gzip)
   - `vendor-supabase` — Supabase client (46KB gzip)
   - `vendor-query` — React Query (10KB gzip)
   - `vendor-utils` — date-fns, zod, clsx (28KB gzip)
3. **Route definitions** extracted to `src/routes/publicRoutes.tsx` and `src/routes/protectedRoutes.tsx`

## Rationale

- **Initial load** reduced to ~75KB gzip (index.js only)
- **Charts and animations** only load when user navigates to those pages
- **Route organization** scales to 100+ routes without App.tsx bloat

## Consequences

- Every page shows a skeleton loader during lazy load
- Route changes require updating the route config files, not App.tsx
- Bundle analysis should be run periodically to detect regression
