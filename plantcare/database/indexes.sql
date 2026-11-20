-- =============================================================================
-- VerdeBase - Indexes
-- Optimized for common query patterns
-- =============================================================================

-- plants table indexes
CREATE INDEX IF NOT EXISTS idx_plants_user_id
    ON plants(user_id);

CREATE INDEX IF NOT EXISTS idx_plants_species_id
    ON plants(species_id);

CREATE INDEX IF NOT EXISTS idx_plants_health_status
    ON plants(health_status);

CREATE INDEX IF NOT EXISTS idx_plants_growth_stage
    ON plants(growth_stage);

CREATE INDEX IF NOT EXISTS idx_plants_user_active
    ON plants(user_id, is_active);

-- watering_logs indexes
CREATE INDEX IF NOT EXISTS idx_watering_logs_plant_id
    ON watering_logs(plant_id);

CREATE INDEX IF NOT EXISTS idx_watering_logs_plant_date
    ON watering_logs(plant_id, watered_at DESC);

CREATE INDEX IF NOT EXISTS idx_watering_logs_watered_at
    ON watering_logs(watered_at DESC);

-- fertilization_logs indexes
CREATE INDEX IF NOT EXISTS idx_fertilization_logs_plant_id
    ON fertilization_logs(plant_id);

CREATE INDEX IF NOT EXISTS idx_fertilization_logs_plant_date
    ON fertilization_logs(plant_id, applied_at DESC);

-- growth_logs indexes
CREATE INDEX IF NOT EXISTS idx_growth_logs_plant_id
    ON growth_logs(plant_id);

CREATE INDEX IF NOT EXISTS idx_growth_logs_plant_date
    ON growth_logs(plant_id, recorded_at DESC);

-- health_logs indexes
CREATE INDEX IF NOT EXISTS idx_health_logs_plant_id
    ON health_logs(plant_id);

CREATE INDEX IF NOT EXISTS idx_health_logs_plant_date
    ON health_logs(plant_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_logs_status
    ON health_logs(health_status);

-- disease_records indexes
CREATE INDEX IF NOT EXISTS idx_disease_records_plant_id
    ON disease_records(plant_id);

CREATE INDEX IF NOT EXISTS idx_disease_records_disease_id
    ON disease_records(disease_id);

CREATE INDEX IF NOT EXISTS idx_disease_records_detected_at
    ON disease_records(detected_at DESC);

-- care_schedules indexes
CREATE INDEX IF NOT EXISTS idx_care_schedules_user_id
    ON care_schedules(user_id);

CREATE INDEX IF NOT EXISTS idx_care_schedules_plant_id
    ON care_schedules(plant_id);

CREATE INDEX IF NOT EXISTS idx_care_schedules_active
    ON care_schedules(is_active, schedule_time);

-- notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
    ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications(user_id, is_read)
    WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
    ON notifications(created_at DESC);

-- audit_logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
    ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON audit_logs(entity, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON audit_logs(created_at DESC);

-- users indexes
CREATE INDEX IF NOT EXISTS idx_users_email
    ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_role_id
    ON users(role_id);
