-- Create a table specifically for RLS audit logs if it doesn't exist
CREATE TABLE IF NOT EXISTS public.rls_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    user_id UUID,
    client_ip TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the audit table itself
ALTER TABLE public.rls_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins/service role can view all logs
CREATE POLICY "Admins can view RLS audit logs" ON public.rls_audit_logs
    FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to be called from triggers or app code for RLS auditing
CREATE OR REPLACE FUNCTION public.log_rls_event(
    p_table_name TEXT,
    p_operation TEXT,
    p_details JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.rls_audit_logs (table_name, operation, user_id, client_ip, details)
    VALUES (
        p_table_name,
        p_operation,
        auth.uid(),
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        p_details
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example trigger-based auditing for a critical table (e.g. call_summaries)
-- Note: Real RLS violations (rejected by policy) don't trigger BEFORE/AFTER triggers.
-- We usually log explicit access attempts or use database-level audit extensions.
-- This helper allows manual logging of sensitive operations.

COMMENT ON TABLE public.rls_audit_logs IS 'Logs security-related events and RLS access patterns.';
