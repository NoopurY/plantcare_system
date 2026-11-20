-- =============================================================================
-- VerdeBase (PlantCare 2.0) - PostgreSQL Schema
-- Database: verdebase
-- Version: 2.0.0
-- Description: Fully normalized schema demonstrating 3NF decomposition,
--              referential integrity, check constraints, and typed columns.
-- =============================================================================

-- pgcrypto: used for the crypto/hashing functions demonstrated in DBMS Studio
-- (password hashing itself is done in the app with bcrypt, not here).
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABLE 1: roles
-- Lookup table for user roles (demonstrates normalization)
-- =============================================================================
CREATE TABLE IF NOT EXISTS roles (
    role_id     SERIAL PRIMARY KEY,
    role_name   VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE 2: users
-- Application users with hashed passwords and role assignment
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    user_id        SERIAL PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    full_name      VARCHAR(150) NOT NULL,
    role_id        INTEGER NOT NULL DEFAULT 2 REFERENCES roles(role_id) ON DELETE RESTRICT,
    avatar_url     VARCHAR(500),
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at  TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =============================================================================
-- TABLE 3: species
-- Normalized species reference table (reduces redundancy across plant records)
-- Demonstrates: 3NF normalization — species data stored once, referenced many
-- =============================================================================
CREATE TABLE IF NOT EXISTS species (
    species_id           SERIAL PRIMARY KEY,
    common_name          VARCHAR(150) NOT NULL,
    scientific_name      VARCHAR(200) NOT NULL UNIQUE,
    family               VARCHAR(150),
    water_requirement    VARCHAR(50) NOT NULL DEFAULT 'moderate'
                         CHECK (water_requirement IN ('low', 'moderate', 'high')),
    sunlight_requirement VARCHAR(50) NOT NULL DEFAULT 'indirect'
                         CHECK (sunlight_requirement IN ('full_sun', 'partial_shade', 'indirect', 'low_light')),
    soil_type            VARCHAR(100),
    min_temp_celsius     NUMERIC(5,2),
    max_temp_celsius     NUMERIC(5,2),
    description          TEXT,
    care_difficulty      VARCHAR(20) NOT NULL DEFAULT 'beginner'
                         CHECK (care_difficulty IN ('beginner', 'intermediate', 'expert')),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT species_temp_range CHECK (
        min_temp_celsius IS NULL OR max_temp_celsius IS NULL OR
        min_temp_celsius <= max_temp_celsius
    )
);

-- =============================================================================
-- TABLE 4: care_profiles
-- Default care recommendations per species (normalized separately from species)
-- Demonstrates: further decomposition to avoid species table bloat
-- =============================================================================
CREATE TABLE IF NOT EXISTS care_profiles (
    profile_id              SERIAL PRIMARY KEY,
    species_id              INTEGER NOT NULL UNIQUE REFERENCES species(species_id) ON DELETE CASCADE,
    watering_interval_days  INTEGER NOT NULL DEFAULT 7
                            CHECK (watering_interval_days BETWEEN 1 AND 90),
    fertilize_interval_days INTEGER NOT NULL DEFAULT 30
                            CHECK (fertilize_interval_days BETWEEN 1 AND 365),
    fertilizer_type         VARCHAR(100),
    repot_interval_months   INTEGER CHECK (repot_interval_months BETWEEN 1 AND 60),
    pruning_notes           TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE 5: plants
-- Core plant entity linking users and species
-- Demonstrates: FK to users (ownership), FK to species (normalization)
-- =============================================================================
CREATE TABLE IF NOT EXISTS plants (
    plant_id      SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    species_id    INTEGER REFERENCES species(species_id) ON DELETE SET NULL,
    plant_name    VARCHAR(200) NOT NULL,
    nickname      VARCHAR(100),
    location      VARCHAR(150),
    date_acquired DATE,
    growth_stage  VARCHAR(50) NOT NULL DEFAULT 'seedling'
                  CHECK (growth_stage IN ('seedling', 'juvenile', 'mature', 'flowering', 'dormant')),
    health_status VARCHAR(50) NOT NULL DEFAULT 'healthy'
                  CHECK (health_status IN ('healthy', 'needs_attention', 'critical', 'recovering')),
    image_url     VARCHAR(500),
    notes         TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT plants_user_nickname_unique UNIQUE (user_id, nickname)
);

-- =============================================================================
-- TABLE 6: watering_logs
-- Records of each watering event per plant
-- =============================================================================
CREATE TABLE IF NOT EXISTS watering_logs (
    log_id      SERIAL PRIMARY KEY,
    plant_id    INTEGER NOT NULL REFERENCES plants(plant_id) ON DELETE CASCADE,
    watered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    quantity_ml INTEGER CHECK (quantity_ml > 0),
    method      VARCHAR(50) DEFAULT 'hand_watering'
                CHECK (method IN ('hand_watering', 'drip', 'spray', 'bottom_watering', 'self_watering')),
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE 7: fertilization_logs
-- Records of each fertilization event per plant
-- =============================================================================
CREATE TABLE IF NOT EXISTS fertilization_logs (
    log_id          SERIAL PRIMARY KEY,
    plant_id        INTEGER NOT NULL REFERENCES plants(plant_id) ON DELETE CASCADE,
    fertilizer_type VARCHAR(150) NOT NULL,
    quantity_grams  NUMERIC(8,2) CHECK (quantity_grams > 0),
    applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    method          VARCHAR(50) DEFAULT 'soil'
                    CHECK (method IN ('soil', 'foliar', 'liquid', 'slow_release')),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE 8: growth_logs
-- Periodic growth measurements per plant
-- =============================================================================
CREATE TABLE IF NOT EXISTS growth_logs (
    log_id        SERIAL PRIMARY KEY,
    plant_id      INTEGER NOT NULL REFERENCES plants(plant_id) ON DELETE CASCADE,
    height_cm     NUMERIC(8,2) CHECK (height_cm > 0),
    spread_cm     NUMERIC(8,2) CHECK (spread_cm > 0),
    leaf_count    INTEGER CHECK (leaf_count >= 0),
    growth_stage  VARCHAR(50) CHECK (growth_stage IN ('seedling', 'juvenile', 'mature', 'flowering', 'dormant')),
    recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE 9: health_logs
-- Health assessments with numeric health scores
-- =============================================================================
CREATE TABLE IF NOT EXISTS health_logs (
    log_id        SERIAL PRIMARY KEY,
    plant_id      INTEGER NOT NULL REFERENCES plants(plant_id) ON DELETE CASCADE,
    health_status VARCHAR(50) NOT NULL
                  CHECK (health_status IN ('healthy', 'needs_attention', 'critical', 'recovering')),
    health_score  INTEGER NOT NULL
                  CHECK (health_score BETWEEN 0 AND 100),
    symptoms      TEXT[],
    recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE 10: diseases
-- Lookup table for known plant diseases (normalized reference)
-- =============================================================================
CREATE TABLE IF NOT EXISTS diseases (
    disease_id   SERIAL PRIMARY KEY,
    disease_name VARCHAR(200) NOT NULL UNIQUE,
    category     VARCHAR(100) CHECK (category IN ('fungal', 'bacterial', 'viral', 'pest', 'nutritional', 'environmental')),
    description  TEXT,
    symptoms     TEXT,
    treatment    TEXT,
    prevention   TEXT,
    severity     VARCHAR(20) NOT NULL DEFAULT 'moderate'
                 CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE 11: disease_records
-- Many-to-many junction: plants can have multiple disease instances
-- =============================================================================
CREATE TABLE IF NOT EXISTS disease_records (
    record_id     SERIAL PRIMARY KEY,
    plant_id      INTEGER NOT NULL REFERENCES plants(plant_id) ON DELETE CASCADE,
    disease_id    INTEGER NOT NULL REFERENCES diseases(disease_id) ON DELETE RESTRICT,
    detected_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at   TIMESTAMPTZ,
    severity      VARCHAR(20) NOT NULL DEFAULT 'moderate'
                  CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
    treatment_used TEXT,
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT disease_records_resolved_after_detected CHECK (
        resolved_at IS NULL OR resolved_at >= detected_at
    )
);

-- =============================================================================
-- TABLE 12: care_schedules
-- Reminders/schedules for plant care tasks (replaces Supabase reminders)
-- =============================================================================
CREATE TABLE IF NOT EXISTS care_schedules (
    schedule_id   SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    plant_id      INTEGER REFERENCES plants(plant_id) ON DELETE CASCADE,
    task_type     VARCHAR(50) NOT NULL
                  CHECK (task_type IN ('watering', 'fertilizing', 'repotting', 'pruning', 'inspection', 'custom')),
    schedule_time TIME NOT NULL,
    schedule_days TEXT[] NOT NULL,   -- e.g. ['monday', 'thursday']
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    last_sent_at  TIMESTAMPTZ,
    email         VARCHAR(255),
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE 13: notifications
-- System-generated notifications (triggered by database triggers)
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    plant_id        INTEGER REFERENCES plants(plant_id) ON DELETE SET NULL,
    title           VARCHAR(300) NOT NULL,
    message         TEXT NOT NULL,
    type            VARCHAR(50) NOT NULL
                    CHECK (type IN ('watering_due', 'health_alert', 'disease_detected', 'care_reminder', 'system', 'growth_milestone')),
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE 14: audit_logs
-- System-wide audit trail for all important database operations
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id   SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    action     VARCHAR(50) NOT NULL
               CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'REGISTER')),
    entity     VARCHAR(100) NOT NULL,   -- table name
    entity_id  VARCHAR(255),            -- affected row ID
    old_data   JSONB,
    new_data   JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Update trigger function: auto-update updated_at column
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_species_updated_at ON species;
CREATE TRIGGER trg_species_updated_at
    BEFORE UPDATE ON species
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_care_profiles_updated_at ON care_profiles;
CREATE TRIGGER trg_care_profiles_updated_at
    BEFORE UPDATE ON care_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_plants_updated_at ON plants;
CREATE TRIGGER trg_plants_updated_at
    BEFORE UPDATE ON plants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_care_schedules_updated_at ON care_schedules;
CREATE TRIGGER trg_care_schedules_updated_at
    BEFORE UPDATE ON care_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Insert default roles
-- =============================================================================
INSERT INTO roles (role_name, description) VALUES
    ('admin', 'Full system access including DBMS Studio and user management'),
    ('user',  'Standard user access to own plants and care data')
ON CONFLICT (role_name) DO NOTHING;
