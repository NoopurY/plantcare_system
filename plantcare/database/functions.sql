-- =============================================================================
-- VerdeBase - PostgreSQL Functions
-- Business logic at the database level
-- =============================================================================

-- =============================================================================
-- FUNCTION 1: calculate_plant_health_score
-- Calculates a composite health score (0-100) based on recent care activity
-- Called by: Health assessment trigger, analytics
-- =============================================================================
CREATE OR REPLACE FUNCTION calculate_plant_health_score(p_plant_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_score         INTEGER := 100;
    v_days_no_water INTEGER;
    v_days_no_fert  INTEGER;
    v_last_health   INTEGER;
    v_active_disease INTEGER;
    v_species_water_interval INTEGER;
BEGIN
    -- Get species-recommended watering interval (default 7 days)
    SELECT COALESCE(cp.watering_interval_days, 7) INTO v_species_water_interval
    FROM plants p
    LEFT JOIN care_profiles cp ON p.species_id = cp.species_id
    WHERE p.plant_id = p_plant_id;

    -- Days since last watering
    SELECT COALESCE(
        EXTRACT(DAY FROM NOW() - MAX(watered_at))::INTEGER,
        999
    ) INTO v_days_no_water
    FROM watering_logs
    WHERE plant_id = p_plant_id;

    -- Deduct points for overdue watering
    IF v_days_no_water > v_species_water_interval * 2 THEN
        v_score := v_score - 30;
    ELSIF v_days_no_water > v_species_water_interval THEN
        v_score := v_score - 15;
    END IF;

    -- Days since last fertilization
    SELECT COALESCE(
        EXTRACT(DAY FROM NOW() - MAX(applied_at))::INTEGER,
        999
    ) INTO v_days_no_fert
    FROM fertilization_logs
    WHERE plant_id = p_plant_id;

    IF v_days_no_fert > 60 THEN
        v_score := v_score - 10;
    END IF;

    -- Factor in latest manual health score (weighted 40%)
    SELECT health_score INTO v_last_health
    FROM health_logs
    WHERE plant_id = p_plant_id
    ORDER BY recorded_at DESC
    LIMIT 1;

    IF v_last_health IS NOT NULL THEN
        v_score := ROUND(v_score * 0.6 + v_last_health * 0.4);
    END IF;

    -- Deduct for active diseases
    SELECT COUNT(*) INTO v_active_disease
    FROM disease_records
    WHERE plant_id = p_plant_id AND resolved_at IS NULL;

    v_score := v_score - (v_active_disease * 15);

    -- Clamp between 0 and 100
    RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION 2: calculate_next_watering_date
-- Returns the next recommended watering date based on species profile
-- Called by: Reminders, Plant detail page
-- =============================================================================
CREATE OR REPLACE FUNCTION calculate_next_watering_date(p_plant_id INTEGER)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_last_watered           TIMESTAMPTZ;
    v_watering_interval_days INTEGER;
BEGIN
    -- Get last watering date
    SELECT MAX(watered_at) INTO v_last_watered
    FROM watering_logs
    WHERE plant_id = p_plant_id;

    -- Get species watering interval (default 7 days)
    SELECT COALESCE(cp.watering_interval_days, 7) INTO v_watering_interval_days
    FROM plants p
    LEFT JOIN care_profiles cp ON p.species_id = cp.species_id
    WHERE p.plant_id = p_plant_id;

    IF v_last_watered IS NULL THEN
        RETURN NOW();  -- Never watered — water now
    END IF;

    RETURN v_last_watered + (v_watering_interval_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION 3: get_plant_statistics
-- Returns a record with aggregated statistics for one plant
-- Called by: Plant detail page
-- =============================================================================
CREATE OR REPLACE FUNCTION get_plant_statistics(p_plant_id INTEGER)
RETURNS TABLE (
    total_waterings      BIGINT,
    total_fertilizations BIGINT,
    total_growth_logs    BIGINT,
    total_health_logs    BIGINT,
    active_diseases      BIGINT,
    avg_health_score     NUMERIC,
    height_gain_cm       NUMERIC,
    days_since_watered   INTEGER,
    next_watering_date   TIMESTAMPTZ,
    computed_health      INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM watering_logs      WHERE plant_id = p_plant_id),
        (SELECT COUNT(*) FROM fertilization_logs WHERE plant_id = p_plant_id),
        (SELECT COUNT(*) FROM growth_logs        WHERE plant_id = p_plant_id),
        (SELECT COUNT(*) FROM health_logs        WHERE plant_id = p_plant_id),
        (SELECT COUNT(*) FROM disease_records    WHERE plant_id = p_plant_id AND resolved_at IS NULL),
        (SELECT ROUND(AVG(health_score), 1) FROM health_logs WHERE plant_id = p_plant_id),
        (SELECT COALESCE(MAX(height_cm) - MIN(height_cm), 0) FROM growth_logs WHERE plant_id = p_plant_id),
        (SELECT COALESCE(EXTRACT(DAY FROM NOW() - MAX(watered_at))::INTEGER, NULL) FROM watering_logs WHERE plant_id = p_plant_id),
        calculate_next_watering_date(p_plant_id),
        calculate_plant_health_score(p_plant_id);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION 4: get_user_care_summary
-- Returns care activity summary for a user's entire collection
-- Called by: Analytics page
-- =============================================================================
CREATE OR REPLACE FUNCTION get_user_care_summary(p_user_id INTEGER, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    period_start        DATE,
    period_end          DATE,
    total_plants        BIGINT,
    plants_watered      BIGINT,
    watering_events     BIGINT,
    fertilization_events BIGINT,
    health_checks       BIGINT,
    new_diseases        BIGINT,
    resolved_diseases   BIGINT,
    avg_health_score    NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (NOW() - (p_days || ' days')::INTERVAL)::DATE AS period_start,
        NOW()::DATE AS period_end,
        COUNT(DISTINCT p.plant_id)  AS total_plants,
        COUNT(DISTINCT wl.plant_id) AS plants_watered,
        COUNT(DISTINCT wl.log_id)   AS watering_events,
        COUNT(DISTINCT fl.log_id)   AS fertilization_events,
        COUNT(DISTINCT hl.log_id)   AS health_checks,
        COUNT(DISTINCT dr_new.record_id)  AS new_diseases,
        COUNT(DISTINCT dr_res.record_id)  AS resolved_diseases,
        ROUND(AVG(hl.health_score), 1) AS avg_health_score
    FROM plants p
    LEFT JOIN watering_logs      wl     ON p.plant_id = wl.plant_id
                                      AND wl.watered_at >= NOW() - (p_days || ' days')::INTERVAL
    LEFT JOIN fertilization_logs fl     ON p.plant_id = fl.plant_id
                                      AND fl.applied_at >= NOW() - (p_days || ' days')::INTERVAL
    LEFT JOIN health_logs        hl     ON p.plant_id = hl.plant_id
                                      AND hl.recorded_at >= NOW() - (p_days || ' days')::INTERVAL
    LEFT JOIN disease_records    dr_new ON p.plant_id = dr_new.plant_id
                                      AND dr_new.detected_at >= NOW() - (p_days || ' days')::INTERVAL
    LEFT JOIN disease_records    dr_res ON p.plant_id = dr_res.plant_id
                                      AND dr_res.resolved_at >= NOW() - (p_days || ' days')::INTERVAL
    WHERE p.user_id = p_user_id AND p.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION 5: get_database_statistics
-- Returns metadata about the VerdeBase database (used by DBMS Studio)
-- Called by: DBMS Studio Statistics page
-- =============================================================================
CREATE OR REPLACE FUNCTION get_database_statistics()
RETURNS TABLE (
    table_name    TEXT,
    row_count     BIGINT,
    total_size    TEXT,
    index_count   BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.table_name::TEXT,
        (SELECT reltuples::BIGINT FROM pg_class WHERE relname = t.table_name) AS row_count,
        pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name))) AS total_size,
        (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name) AS index_count
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql;
