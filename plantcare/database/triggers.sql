-- =============================================================================
-- VerdeBase - PostgreSQL Triggers
-- Real event-driven automation in the database layer
-- =============================================================================

-- =============================================================================
-- TRIGGER 1: After watering log insert → update plant health status
-- When a watering record is added, recalculate plant health and
-- create a notification if health is below threshold
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_after_watering_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_computed_health INTEGER;
    v_plant_name      TEXT;
    v_user_id         INTEGER;
BEGIN
    -- Get plant info
    SELECT plant_name, user_id INTO v_plant_name, v_user_id
    FROM plants WHERE plant_id = NEW.plant_id;

    -- Recalculate health score
    v_computed_health := calculate_plant_health_score(NEW.plant_id);

    -- Update plant status based on computed health
    IF v_computed_health >= 75 THEN
        UPDATE plants SET health_status = 'healthy', updated_at = NOW()
        WHERE plant_id = NEW.plant_id;
    ELSIF v_computed_health >= 45 THEN
        UPDATE plants SET health_status = 'needs_attention', updated_at = NOW()
        WHERE plant_id = NEW.plant_id;
    ELSE
        UPDATE plants SET health_status = 'critical', updated_at = NOW()
        WHERE plant_id = NEW.plant_id;
    END IF;

    -- Log to audit
    INSERT INTO audit_logs (user_id, action, entity, entity_id, new_data)
    VALUES (
        v_user_id,
        'INSERT',
        'watering_logs',
        NEW.log_id::TEXT,
        jsonb_build_object(
            'plant_id', NEW.plant_id,
            'watered_at', NEW.watered_at,
            'computed_health', v_computed_health
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_watering_insert ON watering_logs;
CREATE TRIGGER trg_after_watering_insert
    AFTER INSERT ON watering_logs
    FOR EACH ROW EXECUTE FUNCTION fn_after_watering_insert();

-- =============================================================================
-- TRIGGER 2: After disease record insert → create notification for user
-- When a disease is detected, automatically create a health alert notification
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_after_disease_record_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_plant_name   TEXT;
    v_user_id      INTEGER;
    v_disease_name TEXT;
BEGIN
    -- Get plant and disease info
    SELECT p.plant_name, p.user_id INTO v_plant_name, v_user_id
    FROM plants p WHERE p.plant_id = NEW.plant_id;

    SELECT d.disease_name INTO v_disease_name
    FROM diseases d WHERE d.disease_id = NEW.disease_id;

    -- Create notification
    INSERT INTO notifications (user_id, plant_id, title, message, type)
    VALUES (
        v_user_id,
        NEW.plant_id,
        '⚠️ Disease Detected: ' || v_disease_name,
        v_plant_name || ' has been diagnosed with ' || v_disease_name ||
        '. Severity: ' || NEW.severity || '. Please take immediate action.',
        'disease_detected'
    );

    -- Update plant health status to critical if severe
    IF NEW.severity IN ('severe', 'critical') THEN
        UPDATE plants SET health_status = 'critical', updated_at = NOW()
        WHERE plant_id = NEW.plant_id;
    ELSIF NEW.severity = 'moderate' THEN
        UPDATE plants SET health_status = 'needs_attention', updated_at = NOW()
        WHERE plant_id = NEW.plant_id;
    END IF;

    -- Log to audit
    INSERT INTO audit_logs (user_id, action, entity, entity_id, new_data)
    VALUES (
        v_user_id,
        'INSERT',
        'disease_records',
        NEW.record_id::TEXT,
        jsonb_build_object(
            'plant_id', NEW.plant_id,
            'disease_name', v_disease_name,
            'severity', NEW.severity
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_disease_record_insert ON disease_records;
CREATE TRIGGER trg_after_disease_record_insert
    AFTER INSERT ON disease_records
    FOR EACH ROW EXECUTE FUNCTION fn_after_disease_record_insert();

-- =============================================================================
-- TRIGGER 3: After growth log insert → update plant growth stage
-- Automatically infers growth stage from recorded measurements
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_after_growth_log_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id    INTEGER;
    v_new_stage  VARCHAR(50);
    v_old_stage  VARCHAR(50);
    v_milestone  TEXT;
BEGIN
    -- Get current plant stage and user
    SELECT growth_stage, user_id INTO v_old_stage, v_user_id
    FROM plants WHERE plant_id = NEW.plant_id;

    -- Infer stage if provided in log
    IF NEW.growth_stage IS NOT NULL AND NEW.growth_stage <> v_old_stage THEN
        v_new_stage := NEW.growth_stage;

        -- Update plant growth stage
        UPDATE plants SET growth_stage = v_new_stage, updated_at = NOW()
        WHERE plant_id = NEW.plant_id;

        -- Create milestone notification
        v_milestone := 'Plant has progressed to: ' || v_new_stage;
        INSERT INTO notifications (user_id, plant_id, title, message, type)
        SELECT
            v_user_id,
            NEW.plant_id,
            '🌱 Growth Milestone!',
            plant_name || ': ' || v_milestone,
            'growth_milestone'
        FROM plants WHERE plant_id = NEW.plant_id;
    END IF;

    -- Log to audit
    INSERT INTO audit_logs (user_id, action, entity, entity_id, new_data)
    VALUES (
        v_user_id,
        'INSERT',
        'growth_logs',
        NEW.log_id::TEXT,
        jsonb_build_object(
            'plant_id', NEW.plant_id,
            'height_cm', NEW.height_cm,
            'leaf_count', NEW.leaf_count,
            'growth_stage', NEW.growth_stage
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_growth_log_insert ON growth_logs;
CREATE TRIGGER trg_after_growth_log_insert
    AFTER INSERT ON growth_logs
    FOR EACH ROW EXECUTE FUNCTION fn_after_growth_log_insert();

-- =============================================================================
-- TRIGGER 4: After health log insert → update plant health status
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_after_health_log_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id INTEGER;
    v_new_status VARCHAR(50);
BEGIN
    -- Get user
    SELECT user_id INTO v_user_id FROM plants WHERE plant_id = NEW.plant_id;

    -- Map health score to status
    IF NEW.health_score >= 75 THEN
        v_new_status := 'healthy';
    ELSIF NEW.health_score >= 45 THEN
        v_new_status := 'needs_attention';
    ELSIF NEW.health_score >= 20 THEN
        v_new_status := 'critical';
    ELSE
        v_new_status := 'critical';
    END IF;

    -- Update plant health status
    UPDATE plants SET health_status = v_new_status, updated_at = NOW()
    WHERE plant_id = NEW.plant_id;

    -- Alert if critical
    IF NEW.health_score < 30 THEN
        INSERT INTO notifications (user_id, plant_id, title, message, type)
        SELECT
            v_user_id,
            NEW.plant_id,
            '🚨 Critical Health Alert!',
            plant_name || ' has a health score of ' || NEW.health_score || '/100. Immediate attention required!',
            'health_alert'
        FROM plants WHERE plant_id = NEW.plant_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_health_log_insert ON health_logs;
CREATE TRIGGER trg_after_health_log_insert
    AFTER INSERT ON health_logs
    FOR EACH ROW EXECUTE FUNCTION fn_after_health_log_insert();

-- =============================================================================
-- TRIGGER 5: After plant insert → create welcome notification
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_after_plant_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, plant_id, title, message, type)
    VALUES (
        NEW.user_id,
        NEW.plant_id,
        '🌿 New Plant Added!',
        NEW.plant_name || ' has been added to your collection. Start logging care activities!',
        'system'
    );

    INSERT INTO audit_logs (user_id, action, entity, entity_id, new_data)
    VALUES (
        NEW.user_id,
        'INSERT',
        'plants',
        NEW.plant_id::TEXT,
        jsonb_build_object('plant_name', NEW.plant_name, 'health_status', NEW.health_status)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_plant_insert ON plants;
CREATE TRIGGER trg_after_plant_insert
    AFTER INSERT ON plants
    FOR EACH ROW EXECUTE FUNCTION fn_after_plant_insert();
