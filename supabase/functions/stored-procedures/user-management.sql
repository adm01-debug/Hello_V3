-- User Management Stored Procedures with Enhanced Error Handling
BEGIN;

-- Function: Upsert user profile with validation
CREATE OR REPLACE FUNCTION upsert_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'user'
)
RETURNS TABLE(id UUID, email TEXT, name TEXT, role TEXT, created_at TIMESTAMPTZ) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be NULL';
  END IF;
  
  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'email cannot be NULL or empty';
  END IF;
  
  -- Validate email format
  IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format: %', p_email;
  END IF;
  
  -- Validate role
  IF p_role NOT IN ('user', 'admin', 'moderator') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be user, admin, or moderator', p_role;
  END IF;
  
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM users WHERE users.id = p_user_id) INTO v_exists;
  
  IF v_exists THEN
    -- Update existing user
    RETURN QUERY
    UPDATE users
    SET 
      email = p_email,
      name = COALESCE(p_name, users.name),
      role = p_role,
      updated_at = NOW()
    WHERE users.id = p_user_id
    RETURNING users.id, users.email, users.name, users.role, users.created_at;
  ELSE
    -- Insert new user
    RETURN QUERY
    INSERT INTO users (id, email, name, role)
    VALUES (p_user_id, p_email, p_name, p_role)
    RETURNING users.id, users.email, users.name, users.role, users.created_at;
  END IF;
  
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'User with email % already exists', p_email;
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error upserting user: %', SQLERRM;
END;
$$;

-- Function: Soft delete user with cascade
CREATE OR REPLACE FUNCTION soft_delete_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Validate input
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be NULL';
  END IF;
  
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user_id AND deleted_at IS NULL) 
  INTO v_exists;
  
  IF NOT v_exists THEN
    RAISE EXCEPTION 'User not found or already deleted: %', p_user_id;
  END IF;
  
  -- Soft delete user
  UPDATE users
  SET deleted_at = NOW()
  WHERE id = p_user_id;
  
  -- Soft delete related data
  UPDATE contacts SET deleted_at = NOW() WHERE user_id = p_user_id;
  UPDATE calls SET deleted_at = NOW() WHERE user_id = p_user_id;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting user: %', SQLERRM;
END;
$$;

-- Function: End call with duration calculation
CREATE OR REPLACE FUNCTION end_call(
  p_call_id UUID,
  p_status TEXT DEFAULT 'completed'
)
RETURNS TABLE(id UUID, status TEXT, duration INTEGER, ended_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
  v_duration INTEGER;
BEGIN
  -- Validate inputs
  IF p_call_id IS NULL THEN
    RAISE EXCEPTION 'call_id cannot be NULL';
  END IF;
  
  IF p_status NOT IN ('completed', 'failed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be completed, failed, or cancelled', p_status;
  END IF;
  
  -- Get call start time
  SELECT started_at INTO v_started_at
  FROM calls
  WHERE calls.id = p_call_id;
  
  IF v_started_at IS NULL THEN
    RAISE EXCEPTION 'Call not found: %', p_call_id;
  END IF;
  
  -- Calculate duration in seconds
  v_duration := EXTRACT(EPOCH FROM (NOW() - v_started_at))::INTEGER;
  
  -- Update call
  RETURN QUERY
  UPDATE calls
  SET 
    status = p_status,
    ended_at = NOW(),
    duration = v_duration,
    updated_at = NOW()
  WHERE calls.id = p_call_id
  RETURNING calls.id, calls.status, calls.duration, calls.ended_at;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error ending call: %', SQLERRM;
END;
$$;

-- Function: Get call statistics with date range
CREATE OR REPLACE FUNCTION get_call_stats(
  p_user_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
  total_calls BIGINT,
  completed_calls BIGINT,
  failed_calls BIGINT,
  total_duration BIGINT,
  avg_duration NUMERIC,
  success_rate NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be NULL';
  END IF;
  
  IF p_start_date > p_end_date THEN
    RAISE EXCEPTION 'start_date must be before end_date';
  END IF;
  
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_calls,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT AS completed_calls,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT AS failed_calls,
    COALESCE(SUM(duration), 0)::BIGINT AS total_duration,
    COALESCE(ROUND(AVG(duration), 2), 0) AS avg_duration,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0
    END AS success_rate
  FROM calls
  WHERE user_id = p_user_id
    AND started_at BETWEEN p_start_date AND p_end_date
    AND deleted_at IS NULL;
    
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error calculating call stats: %', SQLERRM;
END;
$$;

-- Function: Search contacts with full-text search
CREATE OR REPLACE FUNCTION search_contacts(
  p_user_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  phone TEXT,
  email TEXT,
  company TEXT,
  rank REAL
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be NULL';
  END IF;
  
  IF p_query IS NULL OR p_query = '' THEN
    RAISE EXCEPTION 'search query cannot be NULL or empty';
  END IF;
  
  IF p_limit <= 0 OR p_limit > 1000 THEN
    RAISE EXCEPTION 'limit must be between 1 and 1000';
  END IF;
  
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.phone,
    c.email,
    c.company,
    ts_rank(
      to_tsvector('english', 
        COALESCE(c.name, '') || ' ' || 
        COALESCE(c.email, '') || ' ' || 
        COALESCE(c.company, '')
      ),
      plainto_tsquery('english', p_query)
    ) AS rank
  FROM contacts c
  WHERE c.user_id = p_user_id
    AND c.deleted_at IS NULL
    AND to_tsvector('english', 
        COALESCE(c.name, '') || ' ' || 
        COALESCE(c.email, '') || ' ' || 
        COALESCE(c.company, '')
      ) @@ plainto_tsquery('english', p_query)
  ORDER BY rank DESC
  LIMIT p_limit;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error searching contacts: %', SQLERRM;
END;
$$;

COMMIT;
