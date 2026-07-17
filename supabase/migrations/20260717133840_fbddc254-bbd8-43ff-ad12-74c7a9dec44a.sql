CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_call_sessions_caller_name_trgm ON public.call_sessions USING gin (caller_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_call_sessions_caller_phone_trgm ON public.call_sessions USING gin (caller_phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_call_sessions_agent_name_trgm ON public.call_sessions USING gin (agent_name gin_trgm_ops);