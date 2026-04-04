# ADR-002: RBAC with Separate Roles Table

**Status:** Accepted  
**Date:** 2025-02  
**Context:** The system needs role-based access control with privilege escalation prevention.

## Decision

Implement RBAC using a **separate `user_roles` table** instead of storing roles on `user_profiles`.

### Schema
```sql
CREATE TYPE app_role AS ENUM ('admin', 'supervisor', 'agent', 'viewer');

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  UNIQUE (user_id, role)
);
```

### Helper Functions (SECURITY DEFINER)
- `has_role(uuid, app_role)` — checks if user has active role
- `is_admin_or_supervisor()` — shorthand for admin/supervisor check
- `get_user_role()` — returns user's primary role from profiles

## Rationale

- **Prevents privilege escalation** — users cannot modify their own role via profile updates
- **Supports multiple roles** per user (future-proof)
- **Role expiration** — supports temporary role assignments
- **Audit trail** — role changes are tracked separately

## Consequences

- Two-step permission lookup: `user_roles` → `role_permissions`
- `user_profiles.role` is kept for backward compatibility but protected by `prevent_role_escalation` trigger
- RLS policies use SECURITY DEFINER functions to avoid recursive policy checks
