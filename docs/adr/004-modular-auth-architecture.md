# ADR-004: Modular Authentication Architecture

**Status:** Accepted  
**Date:** 2025-04  
**Context:** The `useAuth` hook grew to 298 lines, violating single responsibility and making maintenance difficult.

## Decision

Split `useAuth.ts` into focused modules under `src/hooks/auth/`:

```
src/hooks/auth/
├── useAuthState.ts     — State types and initial state
├── useAuthProfile.ts   — Profile fetching logic
├── useAuthSession.ts   — Session management (get, clear, timeouts)
├── useAuthActions.ts   — Sign in, sign up, sign out actions
└── index.ts            — Barrel exports
```

The main `useAuth.ts` composes all modules via hooks composition.

## Rationale

- **Single responsibility** — each module handles one concern
- **Testability** — modules can be unit tested independently
- **Readability** — smaller files are easier to review and maintain
- **Reusability** — `withTimeout` and `clearAuthStorage` are now importable utilities

## Consequences

- Import paths remain unchanged (`@/hooks/useAuth`)
- AuthContext continues to work identically
- Sub-modules can be imported directly if needed via `@/hooks/auth/`
