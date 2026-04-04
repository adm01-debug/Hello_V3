# ADR-003: SECURITY DEFINER for RLS Helper Functions

**Status:** Accepted  
**Date:** 2025-02  
**Context:** RLS policies querying the same table they protect cause infinite recursion in PostgreSQL.

## Decision

All RLS helper functions that query user data (`user_profiles`, `user_roles`, `agents`) are defined with `SECURITY DEFINER` and `SET search_path = public`.

### Functions
- `has_role(_user_id uuid, _role app_role)` 
- `is_admin_or_supervisor()`
- `get_user_role()`
- `get_user_agent_name()`
- `get_user_agent_id()`
- `is_admin_user(_user_id uuid)`
- `can_access_agent_data(target_agent_name text)`
- `is_active_agent(_agent_name text)`

## Rationale

- **Avoids infinite recursion** — SECURITY DEFINER functions bypass RLS when querying
- **Centralized authorization logic** — changes to role checks propagate automatically
- **Performance** — single function call instead of subquery per policy evaluation

## Consequences

- Functions run with owner privileges — must be carefully audited
- `search_path` is explicitly set to prevent schema injection
- All functions are marked `STABLE` for query optimizer hints
