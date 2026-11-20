-- =============================================================================
-- VerdeBase - PostgreSQL Views
-- Real views used by the application — not frontend filters
-- =============================================================================

-- =============================================================================
-- VIEW 1: plant_health_summary
-- Aggregated health overview per plant (most recent health log)
-- Used by: Dashboard, My Plants list
-- =============================================================================
CREATE OR REPLACE VIEW plant_health_summary AS
SELECT
    p.plant_id,
    p.user_id,
    p.plant_name,
    p.nickname,
    p.location,
    p.growth_stage,
    p.health_status,
    p.image_url,
    p.is_active,
    s.common_name   AS species_common_name,
    s.scientific_name AS species_scientific_name,
    hl.health_score AS latest_health_score,
    hl.recorded_at  AS last_health_check,
    hl.symptoms     AS current_symptoms,
    wl.watered_at   AS last_watered,
    gl.height_cm    AS latest_height_cm,
    gl.leaf_count   AS latest_leaf_count
FROM plants p
LEFT JOIN species s ON p.species_id = s.species_id
LEFT JOIN LATERAL (
    SELECT health_score, recorded_at, symptoms
    FROM health_logs
    WHERE plant_id = p.plant_id
    ORDER BY recorded_at DESC
    LIMIT 1
) hl ON TRUE
LEFT JOIN LATERAL (
    SELECT watered_at
    FROM watering_logs
    WHERE plant_id = p.plant_id
    ORDER BY watered_at DESC
    LIMIT 1
) wl ON TRUE
LEFT JOIN LATERAL (
    SELECT height_cm, leaf_count
    FROM growth_logs
    WHERE plant_id = p.plant_id
    ORDER BY recorded_at DESC
    LIMIT 1
) gl ON TRUE
WHERE p.is_active = TRUE;

-- =============================================================================
-- VIEW 2: plant_care_summary
-- Full care history summary per plant
-- Used by: Plant detail page, Care management
-- =============================================================================
CREATE OR REPLACE VIEW plant_care_summary AS
SELECT
    p.plant_id,
    p.user_id,
    p.plant_name,
    p.health_status,
    COUNT(DISTINCT wl.log_id) AS total_waterings,
    COUNT(DISTINCT fl.log_id) AS total_fertilizations,
    COUNT(DISTINCT grl.log_id) AS total_growth_logs,
    COUNT(DISTINCT hll.log_id) AS total_health_logs,
    MAX(wl.watered_at)         AS last_watered,
    MAX(fl.applied_at)         AS last_fertilized,
    AVG(hll.health_score)      AS avg_health_score,
    MIN(grl.height_cm)         AS initial_height_cm,
    MAX(grl.height_cm)         AS current_height_cm
FROM plants p
LEFT JOIN watering_logs       wl  ON p.plant_id = wl.plant_id
LEFT JOIN fertilization_logs  fl  ON p.plant_id = fl.plant_id
LEFT JOIN growth_logs         grl ON p.plant_id = grl.plant_id
LEFT JOIN health_logs         hll ON p.plant_id = hll.plant_id
WHERE p.is_active = TRUE
GROUP BY p.plant_id, p.user_id, p.plant_name, p.health_status;

-- =============================================================================
-- VIEW 3: disease_summary
-- Active and resolved disease records with disease details
-- Used by: Health module, Analytics
-- =============================================================================
CREATE OR REPLACE VIEW disease_summary AS
SELECT
    dr.record_id,
    dr.plant_id,
    p.plant_name,
    p.user_id,
    d.disease_name,
    d.category,
    d.severity AS disease_default_severity,
    dr.severity AS instance_severity,
    dr.detected_at,
    dr.resolved_at,
    dr.treatment_used,
    CASE
        WHEN dr.resolved_at IS NOT NULL THEN 'resolved'
        ELSE 'active'
    END AS status,
    CASE
        WHEN dr.resolved_at IS NOT NULL
        THEN EXTRACT(DAY FROM (dr.resolved_at - dr.detected_at))::INTEGER
        ELSE NULL
    END AS days_to_resolve
FROM disease_records dr
JOIN plants p   ON dr.plant_id   = p.plant_id
JOIN diseases d ON dr.disease_id = d.disease_id;

-- =============================================================================
-- VIEW 4: plant_activity_summary
-- Recent activity feed across all care types for a user's plants
-- Used by: Dashboard activity feed
-- =============================================================================
CREATE OR REPLACE VIEW plant_activity_summary AS
SELECT
    p.user_id,
    p.plant_id,
    p.plant_name,
    'watering' AS activity_type,
    wl.watered_at AS activity_at,
    COALESCE(wl.notes, 'Watered plant') AS activity_note
FROM watering_logs wl
JOIN plants p ON wl.plant_id = p.plant_id
WHERE p.is_active = TRUE

UNION ALL

SELECT
    p.user_id,
    p.plant_id,
    p.plant_name,
    'fertilization' AS activity_type,
    fl.applied_at AS activity_at,
    COALESCE(fl.notes, 'Fertilized with ' || fl.fertilizer_type) AS activity_note
FROM fertilization_logs fl
JOIN plants p ON fl.plant_id = p.plant_id
WHERE p.is_active = TRUE

UNION ALL

SELECT
    p.user_id,
    p.plant_id,
    p.plant_name,
    'health_check' AS activity_type,
    hl.recorded_at AS activity_at,
    'Health score: ' || hl.health_score || '/100' AS activity_note
FROM health_logs hl
JOIN plants p ON hl.plant_id = p.plant_id
WHERE p.is_active = TRUE

UNION ALL

SELECT
    p.user_id,
    p.plant_id,
    p.plant_name,
    'growth_log' AS activity_type,
    gl.recorded_at AS activity_at,
    COALESCE('Height: ' || gl.height_cm || ' cm', 'Growth recorded') AS activity_note
FROM growth_logs gl
JOIN plants p ON gl.plant_id = p.plant_id
WHERE p.is_active = TRUE;

-- =============================================================================
-- VIEW 5: species_care_overview
-- Species with their care requirements (joining species + care_profiles)
-- Used by: Species management page
-- =============================================================================
CREATE OR REPLACE VIEW species_care_overview AS
SELECT
    s.species_id,
    s.common_name,
    s.scientific_name,
    s.family,
    s.water_requirement,
    s.sunlight_requirement,
    s.soil_type,
    s.min_temp_celsius,
    s.max_temp_celsius,
    s.care_difficulty,
    cp.watering_interval_days,
    cp.fertilize_interval_days,
    cp.fertilizer_type,
    cp.repot_interval_months,
    COUNT(pl.plant_id) AS plant_count
FROM species s
LEFT JOIN care_profiles cp ON s.species_id = cp.species_id
LEFT JOIN plants        pl ON s.species_id = pl.species_id AND pl.is_active = TRUE
GROUP BY
    s.species_id, s.common_name, s.scientific_name, s.family,
    s.water_requirement, s.sunlight_requirement, s.soil_type,
    s.min_temp_celsius, s.max_temp_celsius, s.care_difficulty,
    cp.watering_interval_days, cp.fertilize_interval_days,
    cp.fertilizer_type, cp.repot_interval_months;

-- =============================================================================
-- VIEW 6: user_dashboard_stats
-- Aggregated stats per user for the main dashboard
-- Used by: Dashboard top metrics
-- =============================================================================
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT
    u.user_id,
    u.full_name,
    u.email,
    COUNT(DISTINCT p.plant_id)                                          AS total_plants,
    COUNT(DISTINCT p.plant_id) FILTER (WHERE p.health_status = 'healthy')          AS healthy_plants,
    COUNT(DISTINCT p.plant_id) FILTER (WHERE p.health_status = 'needs_attention')  AS needs_attention,
    COUNT(DISTINCT p.plant_id) FILTER (WHERE p.health_status = 'critical')         AS critical_plants,
    COUNT(DISTINCT p.plant_id) FILTER (WHERE p.health_status = 'recovering')       AS recovering_plants,
    COUNT(DISTINCT wl.log_id)  FILTER (WHERE wl.watered_at >= NOW() - INTERVAL '7 days') AS waterings_this_week,
    COUNT(DISTINCT n.notification_id) FILTER (WHERE n.is_read = FALSE)             AS unread_notifications
FROM users u
LEFT JOIN plants p        ON u.user_id = p.user_id AND p.is_active = TRUE
LEFT JOIN watering_logs wl ON p.plant_id = wl.plant_id
LEFT JOIN notifications n  ON u.user_id = n.user_id
GROUP BY u.user_id, u.full_name, u.email;
