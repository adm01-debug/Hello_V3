-- Create password reset requests table with approval workflow
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'expired')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  reviewer_email TEXT,
  rejection_reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all requests
CREATE POLICY "Admins can manage password_reset_requests"
ON public.password_reset_requests
FOR ALL
USING (is_admin_or_supervisor());

-- Users can view their own requests
CREATE POLICY "Users can view own reset requests"
ON public.password_reset_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Anyone can insert (for reset request)
CREATE POLICY "Anyone can request password reset"
ON public.password_reset_requests
FOR INSERT
WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX idx_password_reset_requests_status ON public.password_reset_requests(status);
CREATE INDEX idx_password_reset_requests_user_id ON public.password_reset_requests(user_id);