-- Database Triggers for Automation and Validation
BEGIN;

-- ============================================================================
-- AUDIT TRIGGERS
-- ============================================================================

-- Function to log changes to audit table
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      resource,
      resource_id,
      timestamp,
      metadata,
      severity
    ) VALUES (
      NEW.user_id,
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      NOW(),
      row_to_json(NEW),
      'low'
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      resource,
      resource_id,
      timestamp,
      metadata,
      severity
    ) VALUES (
      NEW.user_id,
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      NOW(),
      jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)),
      'medium'
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      resource,
      resource_id,
      timestamp,
      metadata,
      severity
    ) VALUES (
      OLD.user_id,
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      NOW(),
      row_to_json(OLD),
      'high'
    );
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER users_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER calls_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON calls
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================================
-- TIMESTAMP TRIGGERS
-- ============================================================================

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER contacts_update_timestamp
BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER calls_update_timestamp
BEFORE UPDATE ON calls
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- VALIDATION TRIGGERS
-- ============================================================================

-- Validate email format
CREATE OR REPLACE FUNCTION validate_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format: %', NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_email_validation
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION validate_email();

CREATE TRIGGER contacts_email_validation
BEFORE INSERT OR UPDATE ON contacts
FOR EACH ROW
WHEN (NEW.email IS NOT NULL)
EXECUTE FUNCTION validate_email();

-- Validate phone number format
CREATE OR REPLACE FUNCTION validate_phone()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND 
     NEW.phone !~ '^\+?[1-9]\d{1,14}$' THEN
    RAISE EXCEPTION 'Invalid phone format: %', NEW.phone;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_phone_validation
BEFORE INSERT OR UPDATE ON contacts
FOR EACH ROW
WHEN (NEW.phone IS NOT NULL)
EXECUTE FUNCTION validate_phone();

-- ============================================================================
-- BUSINESS LOGIC TRIGGERS
-- ============================================================================

-- Prevent deletion of active calls
CREATE OR REPLACE FUNCTION prevent_active_call_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN ('active', 'ringing') THEN
    RAISE EXCEPTION 'Cannot delete active or ringing call';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_active_call_deletion_trigger
BEFORE DELETE ON calls
FOR EACH ROW EXECUTE FUNCTION prevent_active_call_deletion();

-- Auto-calculate call duration
CREATE OR REPLACE FUNCTION calculate_call_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_call_duration_trigger
BEFORE INSERT OR UPDATE ON calls
FOR EACH ROW EXECUTE FUNCTION calculate_call_duration();

-- ============================================================================
-- CASCADE TRIGGERS
-- ============================================================================

-- Soft delete related records when user is deleted
CREATE OR REPLACE FUNCTION cascade_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contacts SET deleted_at = NOW() WHERE user_id = OLD.id;
  UPDATE calls SET deleted_at = NOW() WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_user_deletion_trigger
AFTER UPDATE ON users
FOR EACH ROW
WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
EXECUTE FUNCTION cascade_user_deletion();

-- ============================================================================
-- NOTIFICATION TRIGGERS
-- ============================================================================

-- Notify on critical events
CREATE OR REPLACE FUNCTION notify_critical_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.severity = 'critical' THEN
    PERFORM pg_notify('critical_event', 
      json_build_object(
        'action', NEW.action,
        'resource', NEW.resource,
        'user_id', NEW.user_id,
        'timestamp', NEW.timestamp
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_critical_event_trigger
AFTER INSERT ON audit_logs
FOR EACH ROW EXECUTE FUNCTION notify_critical_event();

COMMIT;
