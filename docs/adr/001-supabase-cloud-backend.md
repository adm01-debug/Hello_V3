# ADR-001: Supabase as Backend via Lovable Cloud

**Status:** Accepted  
**Date:** 2025-01  
**Context:** The system needs authentication, database, real-time subscriptions, file storage, and serverless functions.

## Decision

Use Supabase (via Lovable Cloud) as the unified backend platform, providing:
- **PostgreSQL** with Row Level Security for data access control
- **Supabase Auth** for authentication (email/password + Google OAuth)
- **Edge Functions** (Deno) for server-side business logic
- **Storage** for call recordings
- **Realtime** for live dashboard updates

## Rationale

- Single platform reduces operational complexity
- RLS provides database-level security enforcement
- Edge Functions eliminate the need for a separate API server
- Lovable Cloud manages infrastructure automatically

## Consequences

- All backend logic runs in Edge Functions (Deno runtime)
- No traditional REST API server — client communicates via Supabase SDK
- Database schema changes require migrations
- Frontend must not contain backend dependencies (Express, Redis, etc.)
