-- =============================================================================
-- VerdeBase (PlantCare 2.0) — Sample Queries
-- Database: verdebase
-- Version: 2.0.0
-- Description: 20 example queries demonstrating core DBMS concepts including
--              aggregation, subqueries, views, functions, JSONB, arrays, and more.
-- =============================================================================


-- =============================================================================
-- QUERY 1 — Basic SELECT with WHERE
-- Concept: Filtered retrieval — returns only plants that need attention or
--          are in a critical health state for a specific user.
-- =============================================================================
SELECT
    p.plant_name,
    p.nickname,
    p.location,
    p.health_status,
    p.growth_stage,
    s.common_name AS species
FROM plants p
JOIN species s ON s.species_id = p.species_id
WHERE
    p.user_id      = '22222222-2222-2222-2222-222222222222'
    AND p.health_status IN ('needs_attention', 'critical')
    AND p.is_active = TRUE;


-- =============================================================================
-- QUERY 2 — SELECT with ORDER BY
-- Concept: Sorting — lists all plant species ordered by care difficulty
--          (expert first) then alphabetically within each difficulty tier.
-- =============================================================================
SELECT
    common_name,
    scientific_name,
    family,
    care_difficulty,
    water_requirement,
    sunlight_requirement
FROM species
ORDER BY
    CASE care_difficulty
        WHEN 'expert'        THEN 1
        WHEN 'intermediate'  THEN 2
        WHEN 'beginner'      THEN 3
    END,
    common_name ASC;


-- =============================================================================
-- QUERY 3 — Aggregate with COUNT
-- Concept: Aggregate function — counts how many plants each user owns,
--          grouped by user email.
-- =============================================================================
SELECT
    u.email,
    u.full_name,
    COUNT(p.plant_id) AS total_plants
FROM users u
LEFT JOIN plants p ON p.user_id = u.user_id AND p.is_active = TRUE
GROUP BY u.user_id, u.email, u.full_name
ORDER BY total_plants DESC;


-- =============================================================================
-- QUERY 4 — GROUP BY with HAVING
-- Concept: Filtered aggregation — finds plants that have been watered
--          MORE than 3 times in the last 30 days (overwatering candidates).
-- =============================================================================
SELECT
    p.plant_name,
    p.nickname,
    COUNT(wl.log_id) AS watering_count_last_30_days
FROM plants p
JOIN watering_logs wl
    ON wl.plant_id   = p.plant_id
    AND wl.watered_at >= NOW() - INTERVAL '30 days'
GROUP BY p.plant_id, p.plant_name, p.nickname
HAVING COUNT(wl.log_id) > 3
ORDER BY watering_count_last_30_days DESC;


-- =============================================================================
-- QUERY 5 — Aggregate with AVG
-- Concept: Numeric aggregation — computes the average health score per plant
--          from health_logs, revealing long-term trends.
-- =============================================================================
SELECT
    p.plant_name,
    p.health_status                     AS current_status,
    ROUND(AVG(hl.health_score), 1)      AS avg_health_score,
    MIN(hl.health_score)                AS lowest_score,
    MAX(hl.health_score)                AS highest_score,
    COUNT(hl.log_id)                    AS total_assessments
FROM plants p
JOIN health_logs hl ON hl.plant_id = p.plant_id
WHERE p.user_id = '22222222-2222-2222-2222-222222222222'
GROUP BY p.plant_id, p.plant_name, p.health_status
ORDER BY avg_health_score ASC;


-- =============================================================================
-- QUERY 6 — Subquery
-- Concept: Correlated subquery — retrieves each plant alongside the date and
--          volume of its most recent watering event.
-- =============================================================================
SELECT
    p.plant_name,
    p.location,
    recent.watered_at   AS last_watered,
    recent.quantity_ml  AS last_quantity_ml
FROM plants p
JOIN LATERAL (
    SELECT watered_at, quantity_ml
    FROM watering_logs
    WHERE plant_id = p.plant_id
    ORDER BY watered_at DESC
    LIMIT 1
) AS recent ON TRUE
WHERE p.is_active = TRUE
ORDER BY recent.watered_at ASC;   -- plants longest-ago watered listed first


-- =============================================================================
-- QUERY 7 — Query using a VIEW
-- Concept: Abstraction via VIEW — the view plant_health_summary encapsulates
--          the join of plants, species, users, and latest health score so
--          application code stays clean.
-- (Assumes this view was created in views.sql / triggers.sql — adjust if needed)
-- =============================================================================

-- First, create the view if it does not already exist:
CREATE OR REPLACE VIEW plant_health_summary AS
SELECT
    p.plant_id,
    p.plant_name,
    p.nickname,
    p.location,
    p.health_status,
    p.growth_stage,
    s.common_name          AS species_name,
    s.care_difficulty,
    u.full_name            AS owner_name,
    u.email                AS owner_email,
    (
        SELECT health_score
        FROM health_logs
        WHERE plant_id = p.plant_id
        ORDER BY recorded_at DESC
        LIMIT 1
    )                      AS latest_health_score
FROM plants p
JOIN species s ON s.species_id = p.species_id
JOIN users   u ON u.user_id    = p.user_id
WHERE p.is_active = TRUE;

-- Now query the view:
SELECT
    plant_name,
    species_name,
    health_status,
    latest_health_score,
    owner_name
FROM plant_health_summary
WHERE care_difficulty = 'expert'
ORDER BY latest_health_score ASC NULLS LAST;


-- =============================================================================
-- QUERY 8 — Query using a FUNCTION
-- Concept: User-defined function — encapsulates business logic (days since
--          last watering) so it can be reused across queries and the API.
-- =============================================================================

-- Create helper function:
CREATE OR REPLACE FUNCTION days_since_last_watered(p_plant_id INTEGER)
RETURNS INTEGER AS $$
    SELECT EXTRACT(DAY FROM NOW() - MAX(watered_at))::INTEGER
    FROM watering_logs
    WHERE plant_id = p_plant_id;
$$ LANGUAGE sql STABLE;

-- Use the function in a query to flag plants overdue for watering:
SELECT
    p.plant_name,
    s.common_name                            AS species,
    cp.watering_interval_days                AS recommended_interval,
    days_since_last_watered(p.plant_id)      AS days_since_watered,
    CASE
        WHEN days_since_last_watered(p.plant_id) > cp.watering_interval_days
            THEN 'OVERDUE'
        ELSE 'On schedule'
    END                                      AS watering_status
FROM plants p
JOIN species      s  ON s.species_id  = p.species_id
JOIN care_profiles cp ON cp.species_id = s.species_id
WHERE p.is_active = TRUE
ORDER BY days_since_last_watered(p.plant_id) DESC NULLS LAST;


-- =============================================================================
-- QUERY 9 — UPDATE with WHERE
-- Concept: Conditional DML — marks all plants belonging to a user as
--          'recovering' if they are currently flagged 'critical', reflecting
--          a care intervention.
-- =============================================================================
UPDATE plants
SET
    health_status = 'recovering',
    updated_at    = NOW(),
    notes         = COALESCE(notes, '') || ' [Manual recovery flag set on ' || NOW()::DATE || ']'
WHERE
    user_id       = '22222222-2222-2222-2222-222222222222'
    AND health_status = 'critical';

-- Verify:
SELECT plant_id, plant_name, health_status, notes
FROM plants
WHERE user_id = '22222222-2222-2222-2222-222222222222'
  AND health_status = 'recovering';


-- =============================================================================
-- QUERY 10 — INSERT example
-- Concept: DML insertion — logs a new watering event for the ZZ Plant,
--          simulating the API recording a care action.
-- =============================================================================
INSERT INTO watering_logs (plant_id, watered_at, quantity_ml, method, notes)
VALUES (
    'gggggggg-gggg-gggg-gggg-gggggggggggg',
    NOW(),
    50,
    'hand_watering',
    'Post-repot minimal watering to settle new soil. Monitoring closely.'
)
RETURNING log_id, plant_id, watered_at, quantity_ml;


-- =============================================================================
-- QUERY 11 — Date-filtered query
-- Concept: Temporal filtering — retrieves all care activity (watering +
--          fertilization) for the last 7 days, unioned into one timeline.
-- =============================================================================
SELECT
    'Watering'          AS activity_type,
    p.plant_name,
    wl.watered_at       AS activity_time,
    wl.notes
FROM watering_logs wl
JOIN plants p ON p.plant_id = wl.plant_id
WHERE wl.watered_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT
    'Fertilization'     AS activity_type,
    p.plant_name,
    fl.applied_at       AS activity_time,
    fl.notes
FROM fertilization_logs fl
JOIN plants p ON p.plant_id = fl.plant_id
WHERE fl.applied_at >= NOW() - INTERVAL '7 days'

ORDER BY activity_time DESC;


-- =============================================================================
-- QUERY 12 — Array field query (schedule_days)
-- Concept: PostgreSQL array operators — finds all care schedules that include
--          'monday' as a scheduled day, demonstrating native array containment.
-- =============================================================================
SELECT
    cs.schedule_id,
    u.full_name             AS owner,
    p.plant_name,
    cs.task_type,
    cs.schedule_time,
    cs.schedule_days,
    cs.is_active
FROM care_schedules cs
JOIN users  u ON u.user_id  = cs.user_id
LEFT JOIN plants p ON p.plant_id = cs.plant_id
WHERE 'monday' = ANY(cs.schedule_days)   -- array containment check
  AND cs.is_active = TRUE
ORDER BY cs.schedule_time;


-- =============================================================================
-- QUERY 13 — JSONB query on audit_logs
-- Concept: Semi-structured data querying — searches audit records where the
--          new_data JSONB field shows a health_status of 'critical', letting
--          admins trace when plants entered critical state.
-- =============================================================================
SELECT
    al.audit_id,
    al.action,
    al.entity,
    al.entity_id,
    al.new_data ->> 'health_status'  AS new_health_status,
    al.old_data ->> 'health_status'  AS old_health_status,
    al.created_at
FROM audit_logs al
WHERE
    al.entity = 'plants'
    AND al.new_data @> '{"health_status": "critical"}'::jsonb
ORDER BY al.created_at DESC;


-- =============================================================================
-- QUERY 14 — Pattern matching with LIKE
-- Concept: String pattern matching — finds species whose scientific name
--          starts with 'F' (genus Ficus) or whose common name contains 'Leaf'.
-- =============================================================================
SELECT
    common_name,
    scientific_name,
    family,
    care_difficulty
FROM species
WHERE
    scientific_name ILIKE 'ficus%'         -- case-insensitive genus match
    OR common_name  ILIKE '%leaf%'         -- contains 'leaf' anywhere
ORDER BY scientific_name;


-- =============================================================================
-- QUERY 15 — BETWEEN for range
-- Concept: Range predicate — finds species suitable for a room kept between
--          18 °C and 25 °C (typical indoor temperature), comparing against
--          min/max temperature columns.
-- =============================================================================
SELECT
    common_name,
    scientific_name,
    min_temp_celsius,
    max_temp_celsius,
    care_difficulty
FROM species
WHERE
    min_temp_celsius <= 18               -- can survive 18 °C lower bound
    AND max_temp_celsius BETWEEN 25 AND 40  -- upper tolerance in range
ORDER BY min_temp_celsius ASC;


-- =============================================================================
-- QUERY 16 — NOT NULL check
-- Concept: NULL awareness — finds disease records that have NOT yet been
--          resolved (resolved_at IS NULL), i.e., active disease cases.
-- =============================================================================
SELECT
    dr.record_id,
    p.plant_name,
    d.disease_name,
    d.category,
    dr.severity,
    dr.detected_at,
    dr.treatment_used
FROM disease_records dr
JOIN plants   p ON p.plant_id   = dr.plant_id
JOIN diseases d ON d.disease_id = dr.disease_id
WHERE dr.resolved_at IS NULL               -- still active
ORDER BY dr.severity DESC, dr.detected_at ASC;


-- =============================================================================
-- QUERY 17 — EXISTS subquery
-- Concept: Semi-join with EXISTS — returns all users who have at least one
--          plant in a 'critical' health state (efficient stop-on-first-match).
-- =============================================================================
SELECT
    u.user_id,
    u.full_name,
    u.email
FROM users u
WHERE EXISTS (
    SELECT 1
    FROM plants p
    WHERE
        p.user_id       = u.user_id
        AND p.health_status = 'critical'
        AND p.is_active = TRUE
)
ORDER BY u.full_name;


-- =============================================================================
-- QUERY 18 — CASE WHEN
-- Concept: Conditional expressions — classifies each plant's watering
--          urgency tier based on days since its last recorded watering.
-- =============================================================================
SELECT
    p.plant_name,
    cp.watering_interval_days                     AS ideal_interval,
    days_since_last_watered(p.plant_id)           AS days_since_watered,
    CASE
        WHEN days_since_last_watered(p.plant_id) IS NULL
            THEN 'No watering record'
        WHEN days_since_last_watered(p.plant_id) > cp.watering_interval_days * 2
            THEN '🚨 Severely Overdue'
        WHEN days_since_last_watered(p.plant_id) > cp.watering_interval_days
            THEN '⚠️  Overdue'
        WHEN days_since_last_watered(p.plant_id) >= cp.watering_interval_days - 1
            THEN '🔔 Due Soon'
        ELSE '✅ On Track'
    END                                            AS watering_urgency
FROM plants p
JOIN species       s  ON s.species_id  = p.species_id
JOIN care_profiles cp ON cp.species_id = s.species_id
WHERE p.is_active = TRUE
ORDER BY days_since_last_watered(p.plant_id) DESC NULLS LAST;


-- =============================================================================
-- QUERY 19 — String functions
-- Concept: Built-in string manipulation — formats a plant "care card" label
--          using UPPER, INITCAP, CONCAT, and LPAD for display purposes.
-- =============================================================================
SELECT
    UPPER(p.plant_name)                                      AS display_name,
    INITCAP(s.common_name) || ' (' || s.scientific_name || ')' AS full_species_label,
    CONCAT('Location: ', COALESCE(p.location, 'Unknown'))    AS location_label,
    LPAD(cp.watering_interval_days::TEXT, 3, '0') || ' days' AS water_interval_padded,
    LENGTH(COALESCE(p.notes, ''))                            AS notes_char_count,
    SUBSTRING(COALESCE(p.notes, 'No notes'), 1, 50)
        || CASE WHEN LENGTH(COALESCE(p.notes,'')) > 50 THEN '…' ELSE '' END AS notes_preview
FROM plants p
JOIN species       s  ON s.species_id  = p.species_id
JOIN care_profiles cp ON cp.species_id = s.species_id
WHERE p.user_id = '22222222-2222-2222-2222-222222222222'
ORDER BY p.plant_name;


-- =============================================================================
-- QUERY 20 — EXPLAIN (query plan analysis)
-- Concept: Query optimisation — uses EXPLAIN ANALYZE to show the planner's
--          execution strategy for a multi-table join with aggregation, helping
--          identify sequential scans or missing indexes.
-- =============================================================================
EXPLAIN ANALYZE
SELECT
    p.plant_name,
    COUNT(wl.log_id)         AS watering_events,
    SUM(wl.quantity_ml)      AS total_ml_watered,
    MAX(wl.watered_at)       AS last_watered
FROM plants p
LEFT JOIN watering_logs wl ON wl.plant_id = p.plant_id
WHERE
    p.user_id    = '22222222-2222-2222-2222-222222222222'
    AND p.is_active = TRUE
GROUP BY p.plant_id, p.plant_name
ORDER BY last_watered DESC NULLS LAST;
