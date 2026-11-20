-- VerdeBase viva live-proof script. Run in psql (\i viva_live_proof.sql) or pgAdmin Query Tool.
-- Errors in steps 1-5 are EXPECTED: they prove the constraints. Nothing is changed permanently.

-- 0. Setup: show what we have
SELECT plant_id, nickname, health_status FROM plants ORDER BY plant_id;

-- 1. CHECK constraint (score must be 0..100)  -> 23514
INSERT INTO health_logs (plant_id, health_status, health_score)
VALUES ((SELECT plant_id FROM plants WHERE nickname = 'Monty'), 'healthy', 150);

-- 2. UNIQUE (duplicate email)  -> 23505
INSERT INTO users (email, password_hash, full_name)
VALUES ('jane@verdebase.com', 'x', 'Jane Copy');

-- 3. FOREIGN KEY (plant does not exist)  -> 23503
INSERT INTO watering_logs (plant_id, quantity_ml) VALUES (9999, 300);

-- 4. ON DELETE RESTRICT (disease still referenced)  -> 23503
DELETE FROM diseases WHERE disease_name = 'Root Rot';

-- 5. Atomicity: one bad row undoes the good row
BEGIN;
INSERT INTO watering_logs (plant_id, quantity_ml) VALUES ((SELECT plant_id FROM plants WHERE nickname = 'Monty'), 250);
INSERT INTO watering_logs (plant_id, quantity_ml) VALUES ((SELECT plant_id FROM plants WHERE nickname = 'Monty'), -5);
COMMIT;   -- PostgreSQL answers ROLLBACK
SELECT count(*) AS monty_waterings FROM watering_logs
WHERE plant_id = (SELECT plant_id FROM plants WHERE nickname = 'Monty');   -- unchanged

-- 6. Trigger fires, and is undone by ROLLBACK
BEGIN;
INSERT INTO health_logs (plant_id, health_status, health_score, symptoms)
VALUES ((SELECT plant_id FROM plants WHERE nickname = 'ZeZe'), 'critical', 20, ARRAY['wilting']);
SELECT title, created_at FROM notifications ORDER BY notification_id DESC LIMIT 1;  -- Critical Health Alert!
ROLLBACK;
SELECT count(*) AS alerts_after_rollback FROM notifications WHERE type = 'health_alert';  -- 0

-- 7. CASCADE vs SET NULL
SELECT (SELECT count(*) FROM watering_logs) AS waterings,
       (SELECT count(*) FROM notifications WHERE plant_id IS NULL) AS notifs_without_plant;
BEGIN;
DELETE FROM plants WHERE nickname = 'Monty';
SELECT (SELECT count(*) FROM watering_logs) AS waterings,            -- 5 fewer: CASCADE
       (SELECT count(*) FROM notifications WHERE plant_id IS NULL) AS notifs_without_plant;  -- kept: SET NULL
ROLLBACK;

-- 8. Function = the business rule
SELECT nickname, calculate_plant_health_score(plant_id) AS score,
       calculate_next_watering_date(plant_id)::date AS next_water
FROM plants ORDER BY score;

-- 9. Index in a real plan
EXPLAIN ANALYZE
SELECT watered_at FROM watering_logs
WHERE plant_id = (SELECT plant_id FROM plants WHERE nickname = 'ZeZe')
ORDER BY watered_at DESC LIMIT 1;

-- 10. Catalog: our triggers, straight from PostgreSQL
SELECT event_object_table, trigger_name, action_timing, event_manipulation
FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY 1;
