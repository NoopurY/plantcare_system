-- =============================================================================
-- VerdeBase (PlantCare 2.0) — Seed Data
-- Database: verdebase
-- Version: 2.1.0
-- Description: Realistic seed data for development and demonstration.
--              Covers users, species, care profiles, plants, all log types,
--              diseases, disease records, and care schedules.
-- NOTE: Do NOT insert into audit_logs or notifications directly —
--       those are populated by database triggers automatically.
-- NOTE: Primary keys are plain auto-increment integers (SERIAL). Since the
--       exact numeric IDs aren't known ahead of insert, rows below are
--       cross-referenced by natural keys (email, scientific_name, nickname,
--       disease_name) via JOINs instead of hardcoded IDs.
-- =============================================================================

-- Use a transaction so all-or-nothing behaviour is guaranteed
BEGIN;

-- =============================================================================
-- SECTION 1 — USERS
-- =============================================================================
INSERT INTO users (email, password_hash, full_name, role_id, is_active)
VALUES
    (
        'admin@verdebase.com',
        '$2b$10$FoXQuWpRaHnTQ.7Nz..YNePFFDjBrlstvS80sj1qd6tWmmE73kbOK', -- password: Admin@123
        'Verde Admin',
        1,
        TRUE
    ),
    (
        'jane@verdebase.com',
        '$2b$10$lSV1CEoREAV3ds11pWO5oO/GjSLXEBSW7R431BUu01m4DQGWHqfya', -- password: User@123
        'Jane Doe',
        2,
        TRUE
    )
ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- SECTION 2 — SPECIES  (12 popular houseplants)
-- =============================================================================
INSERT INTO species
    (common_name, scientific_name, family, water_requirement, sunlight_requirement,
     soil_type, min_temp_celsius, max_temp_celsius, care_difficulty, description)
VALUES
    -- 1
    ('Monstera', 'Monstera deliciosa', 'Araceae',
     'moderate', 'indirect',
     'Well-draining peat-based mix', 16, 30, 'beginner',
     'Iconic split-leaf tropical plant popular for its dramatic foliage and easy care.'),
    -- 2
    ('Fiddle Leaf Fig', 'Ficus lyrata', 'Moraceae',
     'moderate', 'indirect',
     'Rich, fast-draining mix with perlite', 16, 32, 'expert',
     'Architectural houseplant with large violin-shaped leaves. Sensitive to drafts.'),
    -- 3
    ('Snake Plant', 'Dracaena trifasciata', 'Asparagaceae',
     'low', 'low_light',
     'Sandy, well-draining cactus mix', 10, 35, 'beginner',
     'Nearly indestructible succulent-like plant; an excellent air purifier.'),
    -- 4
    ('Pothos', 'Epipremnum aureum', 'Araceae',
     'moderate', 'low_light',
     'All-purpose potting mix', 15, 30, 'beginner',
     'Fast-growing trailing vine ideal for shelves or hanging baskets.'),
    -- 5
    ('Peace Lily', 'Spathiphyllum wallisii', 'Araceae',
     'high', 'indirect',
     'Rich, moisture-retaining mix with peat', 18, 30, 'beginner',
     'Elegant white-flowering plant that thrives in low light and humid conditions.'),
    -- 6
    ('Rubber Plant', 'Ficus elastica', 'Moraceae',
     'moderate', 'indirect',
     'Well-draining loamy mix', 15, 30, 'intermediate',
     'Bold, glossy leaves make this a striking focal point in any room.'),
    -- 7
    ('Aloe Vera', 'Aloe vera', 'Asphodelaceae',
     'low', 'full_sun',
     'Coarse, gritty cactus and succulent mix', 10, 40, 'beginner',
     'Succulent known for medicinal gel; requires minimal water and bright sun.'),
    -- 8
    ('ZZ Plant', 'Zamioculcas zamiifolia', 'Araceae',
     'low', 'low_light',
     'Well-draining potting mix with perlite', 15, 35, 'beginner',
     'Extremely drought-tolerant glossy-leafed plant. Ideal for low-light offices.'),
    -- 9
    ('Spider Plant', 'Chlorophytum comosum', 'Asparagaceae',
     'moderate', 'indirect',
     'Moist, well-draining all-purpose mix', 10, 30, 'beginner',
     'Produces cascading "spiderettes"; great for hanging baskets and air quality.'),
    -- 10
    ('Boston Fern', 'Nephrolepis exaltata', 'Lomariopsidaceae',
     'high', 'indirect',
     'Rich, peaty, moisture-retaining mix', 15, 28, 'intermediate',
     'Lush, feathery fronds that add a tropical feel; needs consistent humidity.'),
    -- 11
    ('Chinese Money Plant', 'Pilea peperomioides', 'Urticaceae',
     'moderate', 'indirect',
     'Well-draining loamy mix', 13, 30, 'beginner',
     'Round, pancake-shaped leaves on slender stems; propagates easily from offshoots.'),
    -- 12
    ('English Ivy', 'Hedera helix', 'Araliaceae',
     'moderate', 'partial_shade',
     'Moist, well-draining all-purpose mix', 5, 26, 'intermediate',
     'Classic trailing vine with lobed leaves; versatile indoors and outdoors.')
ON CONFLICT (scientific_name) DO NOTHING;

-- =============================================================================
-- SECTION 3 — CARE PROFILES  (one per species)
-- =============================================================================
INSERT INTO care_profiles
    (species_id, watering_interval_days, fertilize_interval_days,
     fertilizer_type, repot_interval_months, pruning_notes)
SELECT s.species_id, cp.wid, cp.fid, cp.ftype, cp.repot, cp.pruning
FROM (
    VALUES
        ('Monstera deliciosa',      7,  30, 'Balanced 20-20-20 liquid',   18, 'Remove yellowed leaves; trim aerial roots if needed.'),
        ('Ficus lyrata',            10, 30, 'Slow-release 3-1-2 granular',24, 'Minimal pruning; wipe dust from leaves monthly.'),
        ('Dracaena trifasciata',    21, 60, 'Diluted balanced liquid',    24, 'Trim brown leaf tips with sterile scissors.'),
        ('Epipremnum aureum',        7, 30, 'Balanced 10-10-10 liquid',   12, 'Pinch vines to encourage bushy growth.'),
        ('Spathiphyllum wallisii',   5, 30, 'Phosphorus-rich liquid',     18, 'Deadhead spent blooms; remove yellowed leaves.'),
        ('Ficus elastica',           9, 30, 'Nitrogen-rich liquid 3-1-2', 24, 'Wipe leaves; prune leggy branches in spring.'),
        ('Aloe vera',               21, 60, 'Succulent/cactus liquid',    36, 'Remove dead outer leaves and pups as needed.'),
        ('Zamioculcas zamiifolia',  14, 60, 'Balanced diluted liquid',    24, 'Remove yellowed stalks at soil level.'),
        ('Chlorophytum comosum',     7, 30, 'Balanced liquid 10-10-10',   18, 'Trim brown tips; remove spiderettes to propagate.'),
        ('Nephrolepis exaltata',     4, 30, 'High-nitrogen liquid',       12, 'Remove dead fronds regularly; divide clumps.'),
        ('Pilea peperomioides',      7, 30, 'Balanced liquid 20-20-20',   18, 'Remove offshoots for propagation.'),
        ('Hedera helix',             7, 30, 'Balanced liquid 10-10-10',   18, 'Trim long stems to maintain shape; remove dead growth.')
) AS cp(sname, wid, fid, ftype, repot, pruning)
JOIN species s ON s.scientific_name = cp.sname
ON CONFLICT (species_id) DO NOTHING;

-- =============================================================================
-- SECTION 4 — PLANTS  (8 plants for Jane)
-- Mixed health statuses, growth stages, locations.
-- Cross-referenced in later sections by nickname (unique per user).
-- =============================================================================
INSERT INTO plants
    (user_id, species_id, plant_name, nickname, location,
     date_acquired, growth_stage, health_status, notes)
SELECT
    u.user_id,
    s.species_id,
    p.plant_name,
    p.nickname,
    p.location,
    p.date_acquired::date,
    p.growth_stage,
    p.health_status,
    p.notes
FROM (
    VALUES
        ('Monty', 'Monstera deliciosa',
         'My Monstera', 'Living Room',
         '2023-03-15', 'mature',        'healthy',
         'Grown from a cutting. Fenestrations developing nicely.'),

        ('Fig the Diva', 'Ficus lyrata',
         'Living Room Fiddle', 'Bedroom',
         '2023-06-01', 'juvenile',      'needs_attention',
         'Dropped a few leaves after moving — acclimating slowly.'),

        ('Snakey', 'Dracaena trifasciata',
         'Hallway Snake', 'Hallway',
         '2022-11-20', 'mature',        'healthy',
         'Thriving with minimal care. Last repotted Jan 2024.'),

        ('Goldie', 'Epipremnum aureum',
         'Kitchen Pothos', 'Kitchen',
         '2023-01-10', 'juvenile',      'healthy',
         'Trailing beautifully over the shelf. Trim monthly.'),

        ('Lily', 'Spathiphyllum wallisii',
         'Bathroom Peace Lily', 'Bathroom',
         '2023-08-22', 'mature',        'needs_attention',
         'Wilting slightly — may need repotting or more humidity.'),

        ('Al', 'Aloe vera',
         'Sunny Aloe', 'Windowsill',
         '2022-05-05', 'mature',        'healthy',
         'Very happy in direct morning sun. Producing pups.'),

        ('ZeZe', 'Zamioculcas zamiifolia',
         'Office ZZ', 'Home Office',
         '2023-09-14', 'juvenile',      'critical',
         'Yellowing stems — suspected overwatering causing root rot.'),

        ('Spidey', 'Chlorophytum comosum',
         'Hanging Spider', 'Porch',
         '2022-12-01', 'mature',        'healthy',
         'Prolific spiderette producer. Watered twice a week in summer.')
) AS p(nickname, sname, plant_name, location, date_acquired, growth_stage, health_status, notes)
JOIN species s ON s.scientific_name = p.sname
CROSS JOIN (SELECT user_id FROM users WHERE email = 'jane@verdebase.com') u
ON CONFLICT (user_id, nickname) DO NOTHING;

-- =============================================================================
-- SECTION 5 — WATERING LOGS  (5 entries per plant over last 30 days)
-- =============================================================================
INSERT INTO watering_logs (plant_id, watered_at, quantity_ml, method, notes)
SELECT p.plant_id, v.watered_at, v.quantity_ml, v.method, v.notes
FROM (
    VALUES
    -- Monty (Monstera)
    ('Monty', NOW() - INTERVAL '28 days',  350, 'hand_watering', 'Soil was dry 2 cm deep.'),
    ('Monty', NOW() - INTERVAL '21 days',  300, 'hand_watering', 'Leaves perked up well.'),
    ('Monty', NOW() - INTERVAL '14 days',  350, 'hand_watering', 'Normal watering.'),
    ('Monty', NOW() - INTERVAL '7 days',   300, 'hand_watering', 'Slight yellowing — reduced quantity.'),
    ('Monty', NOW() - INTERVAL '1 day',    350, 'hand_watering', 'Healthy soil moisture retained.'),

    -- Fig the Diva (Fiddle Leaf)
    ('Fig the Diva', NOW() - INTERVAL '27 days',  400, 'hand_watering', 'Watered thoroughly until drainage.'),
    ('Fig the Diva', NOW() - INTERVAL '20 days',  380, 'hand_watering', 'Noticed top inch dry.'),
    ('Fig the Diva', NOW() - INTERVAL '13 days',  400, 'hand_watering', 'Normal watering.'),
    ('Fig the Diva', NOW() - INTERVAL '6 days',   350, 'hand_watering', 'Leaf drop stopped.'),
    ('Fig the Diva', NOW() - INTERVAL '1 day',    400, 'hand_watering', 'Stable. Monitoring closely.'),

    -- Snakey (Snake Plant)
    ('Snakey', NOW() - INTERVAL '29 days',  200, 'hand_watering', 'Soil bone dry as expected.'),
    ('Snakey', NOW() - INTERVAL '22 days',  180, 'hand_watering', 'Very little water needed.'),
    ('Snakey', NOW() - INTERVAL '14 days',  200, 'hand_watering', 'Normal schedule.'),
    ('Snakey', NOW() - INTERVAL '7 days',   190, 'hand_watering', 'All good.'),
    ('Snakey', NOW() - INTERVAL '2 days',   200, 'hand_watering', 'Continuing reduced watering in winter.'),

    -- Goldie (Pothos)
    ('Goldie', NOW() - INTERVAL '26 days',  300, 'hand_watering', 'Vines looking healthy.'),
    ('Goldie', NOW() - INTERVAL '19 days',  280, 'hand_watering', 'Quick watering.'),
    ('Goldie', NOW() - INTERVAL '12 days',  300, 'hand_watering', 'Normal.'),
    ('Goldie', NOW() - INTERVAL '5 days',   290, 'hand_watering', 'Added a little extra — kitchen is dry.'),
    ('Goldie', NOW() - INTERVAL '1 day',    300, 'hand_watering', 'Leaves bright green.'),

    -- Lily (Peace Lily)
    ('Lily', NOW() - INTERVAL '28 days',  450, 'bottom_watering', 'Left in saucer for 30 min.'),
    ('Lily', NOW() - INTERVAL '21 days',  430, 'bottom_watering', 'Soil moist throughout.'),
    ('Lily', NOW() - INTERVAL '14 days',  450, 'spray',           'Misted leaves too — humid bathroom.'),
    ('Lily', NOW() - INTERVAL '7 days',   400, 'bottom_watering', 'Slight wilt — increased frequency.'),
    ('Lily', NOW() - INTERVAL '2 days',   450, 'bottom_watering', 'Recovering — perked up slightly.'),

    -- Al (Aloe Vera)
    ('Al', NOW() - INTERVAL '30 days',  150, 'hand_watering', 'Fully dry before watering.'),
    ('Al', NOW() - INTERVAL '21 days',  140, 'hand_watering', 'Good colour on leaves.'),
    ('Al', NOW() - INTERVAL '14 days',  150, 'hand_watering', 'Normal.'),
    ('Al', NOW() - INTERVAL '7 days',   130, 'hand_watering', 'Reducing water — cooler weather.'),
    ('Al', NOW() - INTERVAL '1 day',    150, 'hand_watering', 'Pups growing well beside main plant.'),

    -- ZeZe (ZZ Plant — critical)
    ('ZeZe', NOW() - INTERVAL '29 days',  300, 'hand_watering', 'Overwatered — soil was already moist.'),
    ('ZeZe', NOW() - INTERVAL '22 days',  280, 'hand_watering', 'Should have waited longer.'),
    ('ZeZe', NOW() - INTERVAL '15 days',  100, 'hand_watering', 'Reduced drastically after seeing yellowing.'),
    ('ZeZe', NOW() - INTERVAL '8 days',    50, 'hand_watering', 'Minimal — soil still wet. Root rot suspected.'),
    ('ZeZe', NOW() - INTERVAL '3 days',    50, 'hand_watering', 'Checking roots — emergency intervention planned.'),

    -- Spidey (Spider Plant)
    ('Spidey', NOW() - INTERVAL '28 days',  320, 'hand_watering', 'Thriving in porch humidity.'),
    ('Spidey', NOW() - INTERVAL '21 days',  310, 'hand_watering', 'New spiderette spotted.'),
    ('Spidey', NOW() - INTERVAL '14 days',  320, 'hand_watering', 'Normal.'),
    ('Spidey', NOW() - INTERVAL '7 days',   300, 'hand_watering', 'Trimmed a few brown tips.'),
    ('Spidey', NOW() - INTERVAL '2 days',   320, 'hand_watering', 'Excellent growth this month.')
) AS v(nickname, watered_at, quantity_ml, method, notes)
JOIN plants p ON p.nickname = v.nickname;

-- =============================================================================
-- SECTION 6 — FERTILIZATION LOGS  (2 entries per plant)
-- =============================================================================
INSERT INTO fertilization_logs (plant_id, fertilizer_type, quantity_grams, applied_at, method, notes)
SELECT p.plant_id, v.fertilizer_type, v.quantity_grams, v.applied_at, v.method, v.notes
FROM (
    VALUES
    ('Monty', 'Balanced 20-20-20 liquid',    5.0, NOW() - INTERVAL '25 days', 'liquid',       'Diluted 1:10 with water.'),
    ('Monty', 'Balanced 20-20-20 liquid',    5.0, NOW() - INTERVAL '5 days',  'liquid',       'Second application of the month.'),

    ('Fig the Diva', 'Slow-release 3-1-2 granular', 10.0, NOW() - INTERVAL '28 days', 'slow_release','Pressed into topsoil.'),
    ('Fig the Diva', 'Slow-release 3-1-2 granular', 10.0, NOW() - INTERVAL '5 days',  'slow_release','Refreshed granules.'),

    ('Snakey', 'Diluted balanced liquid',     3.0, NOW() - INTERVAL '22 days', 'liquid',       'Very dilute — sensitive to over-fertilizing.'),
    ('Snakey', 'Diluted balanced liquid',     3.0, NOW() - INTERVAL '5 days',  'liquid',       'Light feed for dormant period.'),

    ('Goldie', 'Balanced 10-10-10 liquid',    5.0, NOW() - INTERVAL '24 days', 'liquid',       'Monthly liquid feed.'),
    ('Goldie', 'Balanced 10-10-10 liquid',    5.0, NOW() - INTERVAL '4 days',  'liquid',       'Growth looks excellent post-feed.'),

    ('Lily', 'Phosphorus-rich liquid',      5.0, NOW() - INTERVAL '26 days', 'liquid',       'Encourages blooming.'),
    ('Lily', 'Phosphorus-rich liquid',      5.0, NOW() - INTERVAL '6 days',  'liquid',       'Hoping to trigger another flower.'),

    ('Al', 'Succulent/cactus liquid',     2.0, NOW() - INTERVAL '28 days', 'liquid',       'Very light feed — once a month max.'),
    ('Al', 'Succulent/cactus liquid',     2.0, NOW() - INTERVAL '5 days',  'liquid',       'Growing season — slightly increased.'),

    ('ZeZe', 'Balanced diluted liquid',     2.0, NOW() - INTERVAL '27 days', 'liquid',       'Fertilized before yellowing was noticed.'),
    ('ZeZe', 'Balanced diluted liquid',     1.0, NOW() - INTERVAL '10 days', 'liquid',       'Withheld most feed — plant in stress.'),

    ('Spidey', 'Balanced liquid 10-10-10',   5.0, NOW() - INTERVAL '25 days', 'liquid',       'Monthly feed. Spider plant responded well.'),
    ('Spidey', 'Balanced liquid 10-10-10',   5.0, NOW() - INTERVAL '5 days',  'liquid',       'Pre-propagation boost.')
) AS v(nickname, fertilizer_type, quantity_grams, applied_at, method, notes)
JOIN plants p ON p.nickname = v.nickname;

-- =============================================================================
-- SECTION 7 — GROWTH LOGS  (3 entries per plant showing progression)
-- =============================================================================
INSERT INTO growth_logs (plant_id, height_cm, spread_cm, leaf_count, growth_stage, recorded_at, notes)
SELECT p.plant_id, v.height_cm, v.spread_cm, v.leaf_count, v.growth_stage, v.recorded_at, v.notes
FROM (
    VALUES
    ('Monty', 45.0, 50.0, 8,  'juvenile', NOW() - INTERVAL '90 days', 'Initial measurement after acquisition.'),
    ('Monty', 62.0, 65.0, 12, 'juvenile', NOW() - INTERVAL '45 days', 'Two new leaves since last check.'),
    ('Monty', 80.0, 75.0, 15, 'mature',   NOW() - INTERVAL '7 days',  'First fenestrations visible on new leaf.'),

    ('Fig the Diva', 55.0, 40.0, 6,  'juvenile', NOW() - INTERVAL '90 days', 'Just purchased. Settling in.'),
    ('Fig the Diva', 58.0, 42.0, 5,  'juvenile', NOW() - INTERVAL '45 days', 'Lost one leaf to drop. Stable otherwise.'),
    ('Fig the Diva', 62.0, 44.0, 7,  'juvenile', NOW() - INTERVAL '7 days',  'Recovery — two new leaves emerging.'),

    ('Snakey', 70.0, 35.0, 20, 'mature',   NOW() - INTERVAL '90 days', 'Tall and upright.'),
    ('Snakey', 75.0, 38.0, 23, 'mature',   NOW() - INTERVAL '45 days', 'Slow steady growth.'),
    ('Snakey', 78.0, 40.0, 25, 'mature',   NOW() - INTERVAL '7 days',  'Very healthy — no changes needed.'),

    ('Goldie', 30.0, 60.0, 18, 'juvenile', NOW() - INTERVAL '90 days', 'Trailing nicely.'),
    ('Goldie', 35.0, 80.0, 24, 'juvenile', NOW() - INTERVAL '45 days', 'Added 20 cm of vine length.'),
    ('Goldie', 38.0, 95.0, 30, 'juvenile', NOW() - INTERVAL '7 days',  'Pinched tips — encouraging bushiness.'),

    ('Lily', 40.0, 42.0, 10, 'mature',   NOW() - INTERVAL '90 days', 'Bloomed last month.'),
    ('Lily', 42.0, 44.0, 11, 'mature',   NOW() - INTERVAL '45 days', 'Slight wilting — humidity may be low.'),
    ('Lily', 40.0, 43.0, 10, 'mature',   NOW() - INTERVAL '7 days',  'No new growth; monitoring closely.'),

    ('Al', 25.0, 30.0, 12, 'mature',   NOW() - INTERVAL '90 days', 'Compact and healthy.'),
    ('Al', 27.0, 33.0, 14, 'mature',   NOW() - INTERVAL '45 days', 'Two pups appearing at base.'),
    ('Al', 28.0, 35.0, 15, 'mature',   NOW() - INTERVAL '7 days',  'Pups growing well. Plan to separate soon.'),

    ('ZeZe', 35.0, 28.0, 14, 'juvenile', NOW() - INTERVAL '90 days', 'Lush green, growing steadily.'),
    ('ZeZe', 36.0, 28.0, 12, 'juvenile', NOW() - INTERVAL '45 days', 'Lost 2 leaves — yellowing started.'),
    ('ZeZe', 35.0, 26.0, 10, 'juvenile', NOW() - INTERVAL '7 days',  'Decline visible — root rot suspected.'),

    ('Spidey', 28.0, 55.0, 32, 'mature',   NOW() - INTERVAL '90 days', 'Prolific spiderette production.'),
    ('Spidey', 30.0, 60.0, 38, 'mature',   NOW() - INTERVAL '45 days', 'Propagated 3 spiderettes.'),
    ('Spidey', 31.0, 62.0, 42, 'mature',   NOW() - INTERVAL '7 days',  'Thriving. Minor brown tips trimmed.')
) AS v(nickname, height_cm, spread_cm, leaf_count, growth_stage, recorded_at, notes)
JOIN plants p ON p.nickname = v.nickname;

-- =============================================================================
-- SECTION 8 — HEALTH LOGS  (3 entries per plant showing score history)
-- =============================================================================
INSERT INTO health_logs (plant_id, health_status, health_score, symptoms, recorded_at, notes)
SELECT p.plant_id, v.health_status, v.health_score, v.symptoms, v.recorded_at, v.notes
FROM (
    VALUES
    -- Monty — consistently healthy
    ('Monty', 'healthy',          88, NULL::TEXT[],                      NOW() - INTERVAL '60 days', 'No issues.'),
    ('Monty', 'healthy',          92, NULL::TEXT[],                      NOW() - INTERVAL '30 days', 'New leaf emerging — excellent.'),
    ('Monty', 'healthy',          95, NULL::TEXT[],                      NOW() - INTERVAL '5 days',  'Best condition yet.'),

    -- Fig — declining then stabilising
    ('Fig the Diva', 'healthy',          80, NULL::TEXT[],                      NOW() - INTERVAL '60 days', 'Settled after move.'),
    ('Fig the Diva', 'needs_attention',  62, ARRAY['leaf_drop','pale_leaves'],  NOW() - INTERVAL '30 days', 'Leaf drop after repositioning.'),
    ('Fig the Diva', 'needs_attention',  70, ARRAY['pale_leaves'],              NOW() - INTERVAL '5 days',  'Improving — new growth visible.'),

    -- Snakey — stable
    ('Snakey', 'healthy',          90, NULL::TEXT[],                      NOW() - INTERVAL '60 days', 'Thriving in hallway.'),
    ('Snakey', 'healthy',          91, NULL::TEXT[],                      NOW() - INTERVAL '30 days', 'No concerns.'),
    ('Snakey', 'healthy',          93, NULL::TEXT[],                      NOW() - INTERVAL '5 days',  'Perfect.'),

    -- Goldie — healthy
    ('Goldie', 'healthy',          87, NULL::TEXT[],                      NOW() - INTERVAL '60 days', 'Growing rapidly.'),
    ('Goldie', 'healthy',          89, NULL::TEXT[],                      NOW() - INTERVAL '30 days', 'Vines very healthy.'),
    ('Goldie', 'healthy',          91, NULL::TEXT[],                      NOW() - INTERVAL '5 days',  'Excellent.'),

    -- Lily — declining
    ('Lily', 'healthy',          82, NULL::TEXT[],                      NOW() - INTERVAL '60 days', 'Recently repotted.'),
    ('Lily', 'needs_attention',  65, ARRAY['wilting','yellowing'],      NOW() - INTERVAL '30 days', 'Wilting between waterings.'),
    ('Lily', 'needs_attention',  68, ARRAY['wilting'],                  NOW() - INTERVAL '5 days',  'Slight improvement.'),

    -- Al — healthy
    ('Al', 'healthy',          90, NULL::TEXT[],                      NOW() - INTERVAL '60 days', 'Compact, firm leaves.'),
    ('Al', 'healthy',          93, NULL::TEXT[],                      NOW() - INTERVAL '30 days', 'Pups appearing.'),
    ('Al', 'healthy',          95, NULL::TEXT[],                      NOW() - INTERVAL '5 days',  'Best condition.'),

    -- ZeZe — critical decline
    ('ZeZe', 'healthy',          78, NULL::TEXT[],                      NOW() - INTERVAL '60 days', 'All normal.'),
    ('ZeZe', 'needs_attention',  55, ARRAY['yellowing','soft_stems'],   NOW() - INTERVAL '30 days', 'Overwatering suspected.'),
    ('ZeZe', 'critical',         35, ARRAY['root_rot','mushy_base','yellowing'], NOW() - INTERVAL '5 days', 'Root rot confirmed on inspection.'),

    -- Spidey — healthy
    ('Spidey', 'healthy',          88, NULL::TEXT[],                      NOW() - INTERVAL '60 days', 'Lots of spiderettes.'),
    ('Spidey', 'healthy',          90, ARRAY['brown_tips'],               NOW() - INTERVAL '30 days', 'Minor brown tips — mineral buildup in tap water.'),
    ('Spidey', 'healthy',         92, NULL::TEXT[],                      NOW() - INTERVAL '5 days',  'Tips improved after switching to filtered water.')
) AS v(nickname, health_status, health_score, symptoms, recorded_at, notes)
JOIN plants p ON p.nickname = v.nickname;

-- =============================================================================
-- SECTION 9 — DISEASES  (3 disease types)
-- =============================================================================
INSERT INTO diseases (disease_name, category, description, symptoms, treatment, prevention, severity)
VALUES
    (
        'Leaf Spot',
        'fungal',
        'Fungal infection causing dark or water-soaked spots on foliage.',
        'Brown or black circular spots on leaves, sometimes with yellow halos.',
        'Remove affected leaves; apply copper-based fungicide; improve air circulation.',
        'Avoid overhead watering; ensure good ventilation; do not overcrowd plants.',
        'moderate'
    ),
    (
        'Root Rot',
        'fungal',
        'Overwatering-induced root decay caused by Phytophthora or Pythium species.',
        'Yellowing leaves, wilting despite wet soil, mushy dark roots, foul smell.',
        'Remove from pot; trim rotten roots with sterile scissors; repot in fresh dry mix; reduce watering.',
        'Use well-draining soil; always check moisture before watering; ensure drainage holes.',
        'severe'
    ),
    (
        'Spider Mites',
        'pest',
        'Tiny sap-sucking arachnids that thrive in hot, dry conditions.',
        'Fine webbing on leaves, stippled or bronzed foliage, leaf drop in severe cases.',
        'Spray with neem oil or insecticidal soap; wipe leaves; increase humidity.',
        'Maintain adequate humidity; inspect new plants before introducing them; mist foliage regularly.',
        'moderate'
    )
ON CONFLICT (disease_name) DO NOTHING;

-- =============================================================================
-- SECTION 10 — DISEASE RECORDS  (2 records on affected plants)
-- =============================================================================
INSERT INTO disease_records (plant_id, disease_id, detected_at, resolved_at, severity, treatment_used, notes)
SELECT
    p.plant_id,
    d.disease_id,
    dr.detected_at::timestamptz,
    dr.resolved_at::timestamptz,
    dr.severity,
    dr.treatment_used,
    dr.notes
FROM (
    VALUES
        -- ZeZe has Root Rot (unresolved)
        ('ZeZe', 'Root Rot',
         NOW() - INTERVAL '25 days', NULL,
         'severe',
         'Reduced watering; removed from pot to inspect roots.',
         'Roots visibly dark and mushy. Emergency repot planned.'),

        -- Fiddle Leaf had Leaf Spot (resolved)
        ('Fig the Diva', 'Leaf Spot',
         NOW() - INTERVAL '45 days', NOW() - INTERVAL '20 days',
         'moderate',
         'Removed affected leaves; applied diluted neem oil spray twice weekly.',
         'Fully resolved after 3 weeks of treatment. No recurrence.')
) AS dr(nickname, disease_name, detected_at, resolved_at, severity, treatment_used, notes)
JOIN plants p   ON p.nickname = dr.nickname
JOIN diseases d ON d.disease_name = dr.disease_name;

-- =============================================================================
-- SECTION 11 — CARE SCHEDULES  (3 schedules for Jane)
-- =============================================================================
INSERT INTO care_schedules
    (user_id, plant_id, task_type, schedule_time, schedule_days, is_active, email, notes)
SELECT u.user_id, p.plant_id, v.task_type, v.schedule_time, v.schedule_days, TRUE, u.email, v.notes
FROM (
    VALUES
        ('Monty', 'watering', '08:00:00'::TIME, ARRAY['monday', 'thursday'],
         'Water Monty every Monday and Thursday morning.'),
        ('Lily', 'inspection', '09:00:00'::TIME, ARRAY['sunday'],
         'Weekly health check for Peace Lily — check for wilting or pests.'),
        ('ZeZe', 'repotting', '10:00:00'::TIME, ARRAY['saturday'],
         'Emergency repot reminder for ZZ Plant — root rot intervention.')
) AS v(nickname, task_type, schedule_time, schedule_days, notes)
JOIN plants p ON p.nickname = v.nickname
CROSS JOIN (SELECT user_id, email FROM users WHERE email = 'jane@verdebase.com') u;

-- =============================================================================
-- Commit everything
-- =============================================================================
COMMIT;
