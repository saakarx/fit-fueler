-- 000001_init_schema.down.sql
-- Drops everything created by the up migration, in reverse dependency order.

BEGIN;

DROP TABLE IF EXISTS water_logs;
DROP TABLE IF EXISTS favorite_foods;
DROP TABLE IF EXISTS meal_items;
DROP TABLE IF EXISTS meals;
DROP TABLE IF EXISTS foods;
DROP TABLE IF EXISTS workout_sets;
DROP TABLE IF EXISTS workouts;
DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS weight_entries;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS auth_identities;
DROP TABLE IF EXISTS users;

DROP FUNCTION IF EXISTS set_updated_at();

-- Extensions (citext, pg_trgm) are intentionally left installed, since other
-- objects in the database may depend on them.

COMMIT;
