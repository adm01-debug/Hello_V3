-- Create the audit trigger function
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_user_role TEXT;
    v_details JSONB;
BEGIN
    -- Get user ID from current session if available (auth.uid())
    BEGIN
        v_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    -- Prepare details about the change
    IF (TG_OP = 'DELETE') THEN
        v_details := jsonb_build_object('old_data', row_to_json(OLD));
    ELSIF (TG_OP = 'UPDATE') THEN
        v_details := jsonb_build_object(
            'old_data', row_to_json(OLD),
            'new_data', row_to_json(NEW)
        );
    ELSE
        v_details := jsonb_build_object('new_data', row_to_json(NEW));
    END IF;

    -- Insert into audit_logs
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        created_at
    ) VALUES (
        v_user_id,
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id::text
            ELSE NEW.id::text
        END,
        v_details,
        NOW()
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to contacts
DROP TRIGGER IF EXISTS audit_contacts_trigger ON public.contacts;
CREATE TRIGGER audit_contacts_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Apply trigger to agents
DROP TRIGGER IF EXISTS audit_agents_trigger ON public.agents;
CREATE TRIGGER audit_agents_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.agents
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
