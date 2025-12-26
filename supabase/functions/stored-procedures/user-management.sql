-- Stored Procedures for Common Operations
BEGIN;

-- ============================================================================
-- USER MANAGEMENT
-- ============================================================================

-- Create or update user profile
CREATE OR REPLACE FUNCTION upsert_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'user'
) RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO users (id, email, name, role)
  VALUES (p_user_id, p_email, p_name, p_role)
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW()
  RETURNING users.id, users.email, users.name, users.role, users.created_at;
END;
$$ LANGUAGE plpgsql;

-- Soft delete user
CREATE OR REPLACE FUNCTION soft_delete_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users
  SET deleted_at = NOW()
  WHERE id = p_user_id AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CALL MANAGEMENT
-- ============================================================================

-- End call and update duration
CREATE OR REPLACE FUNCTION end_call(
  p_call_id UUID,
  p_status TEXT DEFAULT 'completed'
) RETURNS TABLE(
  id UUID,
  duration INTEGER,
  status TEXT,
  ended_at TIMESTAMP
) AS $$
DECLARE
  v_started_at TIMESTAMP;
  v_duration INTEGER;
BEGIN
  SELECT started_at INTO v_started_at
  FROM calls
  WHERE id = p_call_id;
  
  v_duration := EXTRACT(EPOCH FROM (NOW() - v_started_at))::INTEGER;
  
  RETURN QUERY
  UPDATE calls
  SET 
    ended_at = NOW(),
    duration = v_duration,
    status = p_call_id,
    updated_at = NOW()
  WHERE id = p_call_id
  RETURNING calls.id, calls.duration, calls.status, calls.ended_at;
END;
$$ LANGUAGE plpgsql;

-- Get user's call statistics
CREATE OR REPLACE FUNCTION get_call_stats(
  p_user_id UUID,
  p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP DEFAULT NOW()
) RETURNS TABLE(
  total_calls BIGINT,
  total_duration INTEGER,
  avg_duration NUMERIC,
  completed_calls BIGINT,
  failed_calls BIGINT,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_calls,
    SUM(duration)::INTEGER AS total_duration,
    AVG(duration)::NUMERIC(10,2) AS avg_duration,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT AS completed_calls,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT AS failed_calls,
    (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / 
     NULLIF(COUNT(*), 0) * 100)::NUMERIC(5,2) AS success_rate
  FROM calls
  WHERE user_id = p_user_id
    AND started_at BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CONTACT MANAGEMENT
-- ============================================================================

-- Merge duplicate contacts
CREATE OR REPLACE FUNCTION merge_contacts(
  p_primary_id UUID,
  p_duplicate_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Update calls to reference primary contact
  UPDATE calls
  SET contact_id = p_primary_id
  WHERE contact_id = p_duplicate_id;
  
  -- Delete duplicate
  DELETE FROM contacts
  WHERE id = p_duplicate_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Search contacts with full-text search
CREATE OR REPLACE FUNCTION search_contacts(
  p_user_id UUID,
  p_query TEXT
) RETURNS TABLE(
  id UUID,
  name TEXT,
  phone TEXT,
  email TEXT,
  company TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.phone,
    c.email,
    c.company,
    ts_rank(to_tsvector('english', c.name || ' ' || COALESCE(c.company, '')), 
            plainto_tsquery('english', p_query)) AS rank
  FROM contacts c
  WHERE c.user_id = p_user_id
    AND to_tsvector('english', c.name || ' ' || COALESCE(c.company, '')) @@ 
        plainto_tsquery('english', p_query)
  ORDER BY rank DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ANALYTICS
-- ============================================================================

-- Get daily call volume
CREATE OR REPLACE FUNCTION get_daily_call_volume(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
) RETURNS TABLE(
  call_date DATE,
  call_count BIGINT,
  total_duration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(started_at) AS call_date,
    COUNT(*)::BIGINT AS call_count,
    SUM(duration)::INTEGER AS total_duration
  FROM calls
  WHERE user_id = p_user_id
    AND started_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE(started_at)
  ORDER BY call_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Get top contacts by call frequency
CREATE OR REPLACE FUNCTION get_top_contacts(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE(
  contact_id UUID,
  contact_name TEXT,
  call_count BIGINT,
  total_duration INTEGER,
  last_call_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS contact_id,
    c.name AS contact_name,
    COUNT(calls.id)::BIGINT AS call_count,
    SUM(calls.duration)::INTEGER AS total_duration,
    MAX(calls.started_at) AS last_call_at
  FROM contacts c
  JOIN calls ON calls.contact_id = c.id
  WHERE c.user_id = p_user_id
  GROUP BY c.id, c.name
  ORDER BY call_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMIT;
