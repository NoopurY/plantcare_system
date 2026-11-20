-- =============================================================================
-- VerdeBase - Demo Queries for DBMS Presentation
-- Organized by DBMS concept category
-- =============================================================================

-- ============================================================
-- CATEGORY 1: BASIC SQL (SELECT, WHERE, ORDER BY)
-- ============================================================

-- Demo 1: Simple SELECT with WHERE filter
-- Concept: Basic Retrieval, Predicate Filtering
SELECT plant_name, location, health_status, growth_stage
FROM plants
WHERE health_status = 'healthy'
ORDER BY plant_name ASC;

-- Demo 2: SELECT with multiple conditions
-- Concept: Compound Predicates (AND/OR)
SELECT plant_name, health_status, growth_stage
FROM plants
WHERE health_status IN ('needs_attention', 'critical')
  AND is_active = TRUE
ORDER BY health_status DESC;

-- ============================================================
-- CATEGORY 2: AGGREGATION
-- ============================================================

-- Demo 3: COUNT with GROUP BY
-- Concept: Aggregation, Grouping
SELECT health_status, COUNT(*) AS plant_count
FROM plants
WHERE is_active = TRUE
GROUP BY health_status
ORDER BY plant_count DESC;

-- Demo 4: GROUP BY with HAVING
-- Concept: Post-aggregation filtering (HAVING vs WHERE)
SELECT species_id, COUNT(*) AS total_plants
FROM plants
WHERE is_active = TRUE
GROUP BY species_id
HAVING COUNT(*) > 1;

-- Demo 5: Aggregate functions
-- Concept: Statistical aggregation
SELECT
    MIN(health_score)   AS min_score,
    MAX(health_score)   AS max_score,
    AVG(health_score)   AS avg_score,
    STDDEV(health_score) AS std_dev
FROM health_logs;

-- ============================================================
-- CATEGORY 3: VIEWS
-- ============================================================

-- Demo 6: Query the plant_health_summary VIEW
-- Concept: Views as virtual tables
SELECT plant_name, species_common_name, latest_health_score, last_watered
FROM plant_health_summary
ORDER BY latest_health_score ASC NULLS LAST;

-- Demo 7: Query plant_activity_summary VIEW
-- Concept: UNION through a view
SELECT activity_type, COUNT(*) AS total_events
FROM plant_activity_summary
GROUP BY activity_type
ORDER BY total_events DESC;

-- ============================================================
-- CATEGORY 4: SUBQUERIES
-- ============================================================

-- Demo 8: Subquery in WHERE clause
-- Concept: Subquery (uncorrelated)
SELECT plant_name, health_status
FROM plants
WHERE plant_id IN (
    SELECT DISTINCT plant_id
    FROM watering_logs
    WHERE watered_at >= NOW() - INTERVAL '7 days'
);

-- Demo 9: EXISTS subquery
-- Concept: Correlated subquery with EXISTS
SELECT plant_name, health_status
FROM plants p
WHERE EXISTS (
    SELECT 1 FROM disease_records dr
    WHERE dr.plant_id = p.plant_id
      AND dr.resolved_at IS NULL
);

-- ============================================================
-- CATEGORY 5: STORED FUNCTIONS
-- ============================================================

-- Demo 10: Call calculate_plant_health_score function
-- Concept: User-defined functions, encapsulated logic
SELECT
    plant_name,
    health_status,
    calculate_plant_health_score(plant_id) AS computed_health_score,
    calculate_next_watering_date(plant_id) AS next_water_due
FROM plants
WHERE is_active = TRUE
ORDER BY computed_health_score ASC;

-- Demo 11: Call get_plant_statistics function
-- Concept: Table-returning functions
SELECT * FROM get_plant_statistics(
    (SELECT plant_id FROM plants LIMIT 1)
);

-- ============================================================
-- CATEGORY 6: NORMALIZATION DEMO
-- ============================================================

-- Demo 12: Without normalization (what the unnormalized form would look like)
-- Concept: 1NF violation — repeating groups
-- This query shows how WITHOUT the species table, every plant would repeat
-- all species data:
SELECT
    p.plant_name,
    p.location,
    s.common_name,
    s.scientific_name,
    s.water_requirement,
    s.sunlight_requirement,
    cp.watering_interval_days
FROM plants p
LEFT JOIN species s ON p.species_id = s.species_id
LEFT JOIN care_profiles cp ON s.species_id = cp.species_id
WHERE p.is_active = TRUE;

-- Demo 13: Why normalization matters — count species usage
-- Concept: 3NF — species data in one place
SELECT
    s.common_name,
    s.water_requirement,
    COUNT(p.plant_id) AS plants_using_this_species
FROM species s
LEFT JOIN plants p ON s.species_id = p.species_id AND p.is_active = TRUE
GROUP BY s.species_id, s.common_name, s.water_requirement
ORDER BY plants_using_this_species DESC;

-- ============================================================
-- CATEGORY 7: CONSTRAINTS DEMONSTRATION
-- ============================================================

-- Demo 14: UNIQUE constraint demo (this WILL fail if run)
-- Concept: UNIQUE constraint enforcement
-- INSERT INTO users (email, password_hash, full_name) VALUES
-- ('admin@verdebase.com', 'hash', 'Duplicate Admin');
-- ERROR: duplicate key value violates unique constraint

-- Demo 15: CHECK constraint demo (this WILL fail if run)
-- Concept: CHECK constraint enforcement
-- INSERT INTO health_logs (plant_id, health_status, health_score)
-- VALUES ((SELECT plant_id FROM plants LIMIT 1), 'healthy', 150);
-- ERROR: new row violates check constraint "health_logs_health_score_check"

-- Demo 16: Valid INSERT showing constraint satisfaction
-- Concept: Correct data that passes all constraints
INSERT INTO health_logs (plant_id, health_status, health_score, notes)
SELECT plant_id, 'healthy', 85, 'Looking great today!'
FROM plants
WHERE is_active = TRUE
LIMIT 1;

-- ============================================================
-- CATEGORY 8: INDEXES & PERFORMANCE
-- ============================================================

-- Demo 17: EXPLAIN ANALYZE — index scan on plants(user_id)
-- Concept: Index usage, execution plan analysis
EXPLAIN ANALYZE
SELECT * FROM plants
WHERE user_id = '22222222-2222-2222-2222-222222222222'
  AND is_active = TRUE;

-- Demo 18: EXPLAIN ANALYZE — range query with composite index
-- Concept: Composite index scan
EXPLAIN ANALYZE
SELECT * FROM watering_logs
WHERE plant_id = (SELECT plant_id FROM plants LIMIT 1)
  AND watered_at >= NOW() - INTERVAL '30 days'
ORDER BY watered_at DESC;

-- ============================================================
-- CATEGORY 9: TRANSACTIONS
-- ============================================================

-- Demo 19: Full transaction — add watering log + verify atomicity
-- Concept: ACID - Atomicity
BEGIN;
    INSERT INTO watering_logs (plant_id, quantity_ml, method, notes)
    SELECT plant_id, 250, 'hand_watering', 'Demo transaction watering'
    FROM plants WHERE is_active = TRUE LIMIT 1;

    -- Verify the insert within the transaction
    SELECT COUNT(*) AS pending_watering_inserts FROM watering_logs
    WHERE notes = 'Demo transaction watering';
ROLLBACK;  -- Rollback to demonstrate atomicity — no permanent change made

-- Demo 20: ACID - Durability demonstration
-- After COMMIT, the data persists even after a server restart
BEGIN;
    INSERT INTO watering_logs (plant_id, quantity_ml, method, notes)
    SELECT plant_id, 300, 'drip', 'Committed watering demo'
    FROM plants WHERE is_active = TRUE LIMIT 1;
COMMIT;
-- Data is now durable in PostgreSQL WAL
