-- Create audit_logs table for tracking access to sensitive data
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_role text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit_logs"
ON public.audit_logs
FOR SELECT
USING (get_user_role() = 'admin');

-- System can insert audit logs (using service role)
CREATE POLICY "System can insert audit_logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- No one can update or delete audit logs (immutable)
-- This ensures audit trail integrity

-- Create function to log access events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_user_role text;
  v_log_id uuid;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  
  SELECT email, role INTO v_user_email, v_user_role
  FROM public.user_profiles
  WHERE id = v_user_id;
  
  -- Insert audit log
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    user_role,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    v_user_id,
    v_user_email,
    v_user_role,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated;