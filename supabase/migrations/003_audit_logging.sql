-- Migration: 003_audit_logging.sql
-- Description: Add audit logging and data versioning capabilities
-- Date: 2025-01-05

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id VARCHAR(255),
    changes JSONB,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create data versions table for tracking historical changes
CREATE TABLE IF NOT EXISTS data_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    version_number INTEGER NOT NULL,
    data JSONB NOT NULL,
    changed_by VARCHAR(255),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(table_name, record_id, version_number)
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

CREATE INDEX idx_data_versions_table_record ON data_versions(table_name, record_id);
CREATE INDEX idx_data_versions_created_at ON data_versions(created_at DESC);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_user_id TEXT;
    audit_ip INET;
    audit_user_agent TEXT;
    changes JSONB;
BEGIN
    -- Get user info from app context (set by application)
    audit_user_id := current_setting('app.user_id', true);
    audit_ip := current_setting('app.ip_address', true)::INET;
    audit_user_agent := current_setting('app.user_agent', true);
    
    -- Calculate changes for UPDATE
    IF TG_OP = 'UPDATE' THEN
        SELECT jsonb_object_agg(key, jsonb_build_object('old', old_value, 'new', new_value))
        INTO changes
        FROM (
            SELECT key, 
                   to_jsonb(OLD) -> key as old_value,
                   to_jsonb(NEW) -> key as new_value
            FROM jsonb_object_keys(to_jsonb(NEW))
            WHERE to_jsonb(OLD) -> key IS DISTINCT FROM to_jsonb(NEW) -> key
        ) as changed_fields;
    END IF;
    
    -- Insert audit log
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action,
        user_id,
        changes,
        old_data,
        new_data,
        ip_address,
        user_agent
    ) VALUES (
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        TG_OP,
        audit_user_id,
        changes,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        audit_ip,
        audit_user_agent
    );
    
    -- Return appropriate value
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create versioning trigger function
CREATE OR REPLACE FUNCTION versioning_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    version_num INTEGER;
BEGIN
    -- Only version on UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Get next version number
        SELECT COALESCE(MAX(version_number), 0) + 1
        INTO version_num
        FROM data_versions
        WHERE table_name = TG_TABLE_NAME
        AND record_id = NEW.id;
        
        -- Insert version record
        INSERT INTO data_versions (
            table_name,
            record_id,
            version_number,
            data,
            changed_by
        ) VALUES (
            TG_TABLE_NAME,
            NEW.id,
            version_num,
            to_jsonb(OLD),
            current_setting('app.user_id', true)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_youth_statistics
    AFTER INSERT OR UPDATE OR DELETE ON youth_statistics
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_budget_allocations
    AFTER INSERT OR UPDATE OR DELETE ON budget_allocations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_court_statistics
    AFTER INSERT OR UPDATE OR DELETE ON court_statistics
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_parliamentary_documents
    AFTER INSERT OR UPDATE OR DELETE ON parliamentary_documents
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Apply versioning triggers (only for UPDATE operations)
CREATE TRIGGER version_youth_statistics
    BEFORE UPDATE ON youth_statistics
    FOR EACH ROW EXECUTE FUNCTION versioning_trigger_function();

CREATE TRIGGER version_budget_allocations
    BEFORE UPDATE ON budget_allocations
    FOR EACH ROW EXECUTE FUNCTION versioning_trigger_function();

-- Create function to set audit context
CREATE OR REPLACE FUNCTION set_audit_context(
    p_user_id TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    IF p_user_id IS NOT NULL THEN
        PERFORM set_config('app.user_id', p_user_id, true);
    END IF;
    IF p_ip_address IS NOT NULL THEN
        PERFORM set_config('app.ip_address', p_ip_address, true);
    END IF;
    IF p_user_agent IS NOT NULL THEN
        PERFORM set_config('app.user_agent', p_user_agent, true);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create view for recent audit activity
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT 
    al.id,
    al.table_name,
    al.action,
    al.user_id,
    al.created_at,
    CASE 
        WHEN al.table_name = 'youth_statistics' THEN 
            al.new_data->>'facility_name'
        WHEN al.table_name = 'budget_allocations' THEN 
            al.new_data->>'program'
        ELSE 
            al.record_id::TEXT
    END as record_description
FROM audit_logs al
WHERE al.created_at > NOW() - INTERVAL '7 days'
ORDER BY al.created_at DESC
LIMIT 100;

-- Create function to get record history
CREATE OR REPLACE FUNCTION get_record_history(
    p_table_name TEXT,
    p_record_id UUID
) RETURNS TABLE (
    version INTEGER,
    changed_at TIMESTAMP WITH TIME ZONE,
    changed_by TEXT,
    changes JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dv.version_number,
        dv.created_at,
        dv.changed_by,
        al.changes
    FROM data_versions dv
    LEFT JOIN audit_logs al ON 
        al.table_name = dv.table_name 
        AND al.record_id = dv.record_id
        AND al.action = 'UPDATE'
        AND al.created_at BETWEEN dv.created_at - INTERVAL '1 second' 
                              AND dv.created_at + INTERVAL '1 second'
    WHERE dv.table_name = p_table_name
    AND dv.record_id = p_record_id
    ORDER BY dv.version_number DESC;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on audit tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for audit tables
CREATE POLICY "Service role full access to audit_logs" ON audit_logs
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon users can view audit_logs" ON audit_logs
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Service role full access to data_versions" ON data_versions
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon users can view data_versions" ON data_versions
    FOR SELECT TO anon
    USING (true);

-- Add comments
COMMENT ON TABLE audit_logs IS 'Tracks all changes to important tables';
COMMENT ON TABLE data_versions IS 'Stores historical versions of records';
COMMENT ON FUNCTION set_audit_context IS 'Sets audit context for the current transaction';
COMMENT ON FUNCTION get_record_history IS 'Gets the complete change history for a record';