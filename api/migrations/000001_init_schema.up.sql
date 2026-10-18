-- 000001_init_schema.up.sql
-- Initial schema (revised). Replaces the earlier draft of 000001; apply to a fresh database.
--
-- Conventions
--   * Nothing is ever hard-deleted. User-owned rows carry is_deleted + deleted_at,
--     and a CHECK keeps the two columns consistent.
--   * Every query must filter on NOT is_deleted. Partial indexes below assume it.
--   * All foreign keys use the default NO ACTION (no cascades), since rows are never removed.
--   * Log tables carry client_request_id so retried creates are idempotent.
--   * All units are metric (ml, g, kg, cm, m). Dates are local_date (user's calendar day).

BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;   -- case-insensitive email
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- fuzzy / prefix search for foods and exercises

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- IDs default to gen_random_uuid() (UUIDv4). To use UUIDv7, generate the ID in Go
-- and pass it on INSERT.

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
-- Account deletion soft-deletes the row AND scrubs email/display_name, so the
-- remaining row no longer identifies anyone. The avatar URL is derived from the id.
CREATE TABLE users (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email        citext,
    display_name text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    is_deleted   boolean NOT NULL DEFAULT false,
    deleted_at   timestamptz,
    CONSTRAINT users_soft_delete_chk CHECK (is_deleted = (deleted_at IS NOT NULL))
);

CREATE UNIQUE INDEX users_email_active_uidx
    ON users (email)
    WHERE email IS NOT NULL AND NOT is_deleted;

-- Partial unique index: signing in again with the same Google account after the
-- old identity was soft-deleted creates a fresh user.
CREATE TABLE auth_identities (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          uuid NOT NULL REFERENCES users (id),
    provider         text NOT NULL CHECK (provider IN ('google', 'apple')),
    provider_user_id text NOT NULL,           -- the provider's stable "sub"
    email            citext,                  -- may be an Apple private relay address
    created_at       timestamptz NOT NULL DEFAULT now(),
    is_deleted       boolean NOT NULL DEFAULT false,
    deleted_at       timestamptz,
    CONSTRAINT auth_identities_soft_delete_chk CHECK (is_deleted = (deleted_at IS NOT NULL))
);

CREATE UNIQUE INDEX auth_identities_provider_uidx
    ON auth_identities (provider, provider_user_id)
    WHERE NOT is_deleted;
CREATE INDEX auth_identities_user_idx ON auth_identities (user_id) WHERE NOT is_deleted;

-- Tokens are revoked, not deleted (revoked_at is their soft-delete equivalent).
CREATE TABLE refresh_tokens (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users (id),
    family_id   uuid NOT NULL,               -- one family per login; revoke all on reuse
    token_hash  text NOT NULL UNIQUE,        -- store a hash, never the raw token
    device_info text,
    expires_at  timestamptz NOT NULL,
    revoked_at  timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX refresh_tokens_user_idx   ON refresh_tokens (user_id);
CREATE INDEX refresh_tokens_family_idx ON refresh_tokens (family_id);

-- ---------------------------------------------------------------------------
-- Profile and goals
-- ---------------------------------------------------------------------------
-- 1:1 with users, never deleted on its own. Current weight is the latest
-- weight_entries row. "Profile completed" is derived (sex, birth_date, height_cm
-- and at least one weight entry), not stored.
CREATE TABLE profiles (
    user_id               uuid PRIMARY KEY REFERENCES users (id),
    sex                   text CHECK (sex IN ('male', 'female', 'other')),
    birth_date            date,
    height_cm             numeric(5,1) CHECK (height_cm > 0),
    activity_level        text CHECK (activity_level IN
                            ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    timezone              text NOT NULL DEFAULT 'UTC',   -- IANA name, e.g. Asia/Kolkata
    units                 jsonb NOT NULL DEFAULT
                            '{"weight":"kg","height":"cm","distance":"km","energy":"kcal","water":"ml"}'::jsonb
                            CHECK (jsonb_typeof(units) = 'object'),
    notifications_enabled boolean NOT NULL DEFAULT true,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Append-only versions: a new row per change, so past analytics use the goal that
-- applied at the time. Rows are never edited or deleted.
CREATE TABLE goals (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid NOT NULL REFERENCES users (id),
    calories_kcal     integer CHECK (calories_kcal > 0),
    protein_g         integer CHECK (protein_g >= 0),
    carbs_g           integer CHECK (carbs_g >= 0),
    fat_g             integer CHECK (fat_g >= 0),
    water_ml          integer CHECK (water_ml > 0),
    workouts_per_week smallint CHECK (workouts_per_week BETWEEN 0 AND 14),
    source            text NOT NULL DEFAULT 'suggested' CHECK (source IN ('suggested', 'user')),
    effective_from    date NOT NULL DEFAULT CURRENT_DATE,
    created_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, effective_from)
);

CREATE INDEX goals_user_effective_idx ON goals (user_id, effective_from DESC);

CREATE TABLE weight_entries (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users (id),
    weight_kg  numeric(5,2) NOT NULL CHECK (weight_kg > 0),
    logged_at  timestamptz NOT NULL DEFAULT now(),
    local_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    is_deleted boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    CONSTRAINT weight_entries_soft_delete_chk CHECK (is_deleted = (deleted_at IS NOT NULL))
);

CREATE INDEX weight_entries_user_date_idx
    ON weight_entries (user_id, local_date DESC, logged_at DESC)
    WHERE NOT is_deleted;

-- ---------------------------------------------------------------------------
-- Exercises and workouts
-- ---------------------------------------------------------------------------
-- Catalog imported from wger by a Go command (not by SQL). Category is free text
-- because it follows wger's own category names. met_value is a rough estimate
-- assigned by the importer, used for calorie estimates.
CREATE TABLE exercises (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source             text NOT NULL CHECK (source IN ('wger', 'custom')),
    source_id          text,
    name               text NOT NULL,
    category           text NOT NULL,
    muscles            text[] NOT NULL DEFAULT '{}',
    equipment          text[] NOT NULL DEFAULT '{}',
    met_value          numeric(4,1) NOT NULL DEFAULT 3.5 CHECK (met_value > 0),
    image_url          text,
    license_name       text,                  -- attribution kept with imported data
    license_author     text,
    created_by_user_id uuid REFERENCES users (id),
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    is_deleted         boolean NOT NULL DEFAULT false,
    deleted_at         timestamptz,
    CONSTRAINT exercises_soft_delete_chk CHECK (is_deleted = (deleted_at IS NOT NULL)),
    CONSTRAINT exercises_custom_owner_chk
        CHECK ((source = 'custom') = (created_by_user_id IS NOT NULL))
);

CREATE UNIQUE INDEX exercises_source_uidx
    ON exercises (source, source_id)
    WHERE source_id IS NOT NULL;
CREATE INDEX exercises_name_trgm_idx
    ON exercises USING gin (name gin_trgm_ops)
    WHERE NOT is_deleted;
CREATE INDEX exercises_category_idx ON exercises (category) WHERE NOT is_deleted;
CREATE INDEX exercises_created_by_idx
    ON exercises (created_by_user_id)
    WHERE created_by_user_id IS NOT NULL AND NOT is_deleted;

-- A workout is a session for one local date. The API adds new entries to the
-- user's session for that date (creating it if needed). Totals for duration and
-- calories are derived by summing entries, not stored here.
CREATE TABLE workouts (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users (id),
    local_date date NOT NULL,
    name       text,
    notes      text,
    started_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    is_deleted boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    CONSTRAINT workouts_soft_delete_chk CHECK (is_deleted = (deleted_at IS NOT NULL))
);

CREATE INDEX workouts_user_date_idx ON workouts (user_id, local_date) WHERE NOT is_deleted;

-- One row per exercise performed: sets x reps at an optional weight. exercise_name is a
-- snapshot so history survives catalog changes. duration_min and calories_burned
-- are filled by the API when the client omits them, and the *_estimated flags
-- record which values are estimates.
CREATE TABLE workout_entries (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id         uuid NOT NULL REFERENCES workouts (id),
    user_id            uuid NOT NULL REFERENCES users (id),
    exercise_id        uuid NOT NULL REFERENCES exercises (id),
    exercise_name      text NOT NULL,
    position           integer NOT NULL DEFAULT 0 CHECK (position >= 0),
    sets               integer NOT NULL CHECK (sets > 0),
    reps               integer NOT NULL CHECK (reps > 0),
    weight_kg          numeric(6,2) CHECK (weight_kg >= 0),   -- NULL = bodyweight / not given
    duration_min       numeric(6,1) CHECK (duration_min >= 0),
    duration_estimated boolean NOT NULL DEFAULT false,
    distance_m         numeric(9,1) CHECK (distance_m >= 0),
    calories_burned    numeric(7,1) CHECK (calories_burned >= 0),
    calories_estimated boolean NOT NULL DEFAULT true,
    client_request_id  uuid,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    is_deleted         boolean NOT NULL DEFAULT false,
    deleted_at         timestamptz,
    CONSTRAINT workout_entries_soft_delete_chk CHECK (is_deleted = (deleted_at IS NOT NULL))
);

CREATE INDEX workout_entries_workout_idx ON workout_entries (workout_id) WHERE NOT is_deleted;
CREATE INDEX workout_entries_exercise_idx ON workout_entries (exercise_id);
CREATE UNIQUE INDEX workout_entries_request_uidx
    ON workout_entries (user_id, client_request_id)
    WHERE client_request_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Foods and meals
-- ---------------------------------------------------------------------------
-- Local catalog and cache of external providers. Nutrition values are per 100 g.
-- To add a provider later, extend the source CHECK in a new migration.
CREATE TABLE foods (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source             text NOT NULL CHECK (source IN ('usda', 'off', 'custom')),
    source_id          text,                  -- NULL for custom foods
    data_type          text,                  -- e.g. foundation, sr_legacy, branded (USDA)
    name               text NOT NULL,
    brand              text,
    barcode            text,
    serving_label      text,                  -- e.g. "1 cup"
    serving_g          numeric(8,2) CHECK (serving_g > 0),
    calories_100g      numeric(8,2) NOT NULL CHECK (calories_100g >= 0),
    protein_100g       numeric(8,2) CHECK (protein_100g >= 0),
    carbs_100g         numeric(8,2) CHECK (carbs_100g >= 0),
    fat_100g           numeric(8,2) CHECK (fat_100g >= 0),
    fiber_100g         numeric(8,2) CHECK (fiber_100g >= 0),
    sugar_100g         numeric(8,2) CHECK (sugar_100g >= 0),
    sodium_mg_100g     numeric(10,2) CHECK (sodium_mg_100g >= 0),
    created_by_user_id uuid REFERENCES users (id),
    fetched_at         timestamptz NOT NULL DEFAULT now(),
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    is_deleted         boolean NOT NULL DEFAULT false,
    deleted_at         timestamptz,
    CONSTRAINT foods_soft_delete_chk CHECK (is_deleted = (deleted_at IS NOT NULL)),
    CONSTRAINT foods_custom_owner_chk
        CHECK ((source = 'custom') = (created_by_user_id IS NOT NULL))
);

CREATE UNIQUE INDEX foods_source_uidx ON foods (source, source_id) WHERE source_id IS NOT NULL;
CREATE INDEX foods_name_trgm_idx ON foods USING gin (name gin_trgm_ops) WHERE NOT is_deleted;
CREATE INDEX foods_barcode_idx ON foods (barcode) WHERE barcode IS NOT NULL AND NOT is_deleted;
CREATE INDEX foods_created_by_idx
    ON foods (created_by_user_id)
    WHERE created_by_user_id IS NOT NULL AND NOT is_deleted;

-- One row per food eaten. food_name and the nutrition columns are snapshots computed by
-- the API from quantity_g at write time, so history never changes retroactively.
CREATE TABLE meal_logs (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid NOT NULL REFERENCES users (id),
    food_id           uuid REFERENCES foods (id),
    meal_type         text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks')),
    local_date        date NOT NULL,
    eaten_at          timestamptz NOT NULL DEFAULT now(),
    food_name         text NOT NULL,
    quantity_g        numeric(8,2) NOT NULL CHECK (quantity_g > 0),
    calories          numeric(8,2) NOT NULL CHECK (calories >= 0),
    protein_g         numeric(8,2) CHECK (protein_g >= 0),
    carbs_g           numeric(8,2) CHECK (carbs_g >= 0),
    fat_g             numeric(8,2) CHECK (fat_g >= 0),
    client_request_id uuid,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    is_deleted        boolean NOT NULL DEFAULT false,
    deleted_at        timestamptz,
    CONSTRAINT meal_logs_soft_delete_chk CHECK (is_deleted = (deleted_at IS NOT NULL))
);

CREATE INDEX meal_logs_user_date_idx ON meal_logs (user_id, local_date) WHERE NOT is_deleted;
CREATE INDEX meal_logs_user_food_idx
    ON meal_logs (user_id, food_id, eaten_at DESC)    -- recent foods
    WHERE food_id IS NOT NULL AND NOT is_deleted;
CREATE UNIQUE INDEX meal_logs_request_uidx
    ON meal_logs (user_id, client_request_id)
    WHERE client_request_id IS NOT NULL;

-- Partial unique index lets a food be favorited again after it was un-favorited.
CREATE TABLE favorite_foods (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users (id),
    food_id    uuid NOT NULL REFERENCES foods (id),
    created_at timestamptz NOT NULL DEFAULT now(),
    is_deleted boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    CONSTRAINT favorite_foods_soft_delete_chk CHECK (is_deleted = (deleted_at IS NOT NULL))
);

CREATE UNIQUE INDEX favorite_foods_user_food_uidx
    ON favorite_foods (user_id, food_id)
    WHERE NOT is_deleted;

-- ---------------------------------------------------------------------------
-- Water
-- ---------------------------------------------------------------------------
-- One row per entry; the daily total is a sum. The per-entry maximum is enforced by the API.
CREATE TABLE water_logs (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid NOT NULL REFERENCES users (id),
    amount_ml         integer NOT NULL CHECK (amount_ml > 0),
    logged_at         timestamptz NOT NULL DEFAULT now(),
    local_date        date NOT NULL,
    client_request_id uuid,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    is_deleted        boolean NOT NULL DEFAULT false,
    deleted_at        timestamptz,
    CONSTRAINT water_logs_soft_delete_chk CHECK (is_deleted = (deleted_at IS NOT NULL))
);

CREATE INDEX water_logs_user_date_idx ON water_logs (user_id, local_date) WHERE NOT is_deleted;
CREATE UNIQUE INDEX water_logs_request_uidx
    ON water_logs (user_id, client_request_id)
    WHERE client_request_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER users_set_updated_at           BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER profiles_set_updated_at        BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER weight_entries_set_updated_at  BEFORE UPDATE ON weight_entries
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER exercises_set_updated_at       BEFORE UPDATE ON exercises
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER workouts_set_updated_at        BEFORE UPDATE ON workouts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER workout_entries_set_updated_at BEFORE UPDATE ON workout_entries
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER foods_set_updated_at           BEFORE UPDATE ON foods
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER meal_logs_set_updated_at       BEFORE UPDATE ON meal_logs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER water_logs_set_updated_at      BEFORE UPDATE ON water_logs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
