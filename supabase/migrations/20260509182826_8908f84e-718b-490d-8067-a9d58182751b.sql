ALTER TABLE public.voip_trunks 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failover_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failover_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failover_reason TEXT;

COMMENT ON COLUMN public.voip_trunks.priority IS 'Priority of the trunk (higher is preferred). Used for automatic failover.';
COMMENT ON COLUMN public.voip_trunks.failover_count IS 'Total number of times this trunk has been swapped due to failure.';
