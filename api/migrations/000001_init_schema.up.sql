-- 000001_init_schema.up.sql
-- Initial schema: identity, profile/goals, workouts, foods/meals, water.

BEGIN;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS citext;   -- case-insensitive email
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- fuzzy / prefix food and exercise search

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- NOTE: IDs default to gen_random_uuid() (UUIDv4). To use UUIDv7, generate the
-- ID in Go and pass it on INSERT (or switch the default to uuidv7() on PG 18+).

-- ---------------------------------------------------------------------------
-- Auth and identity
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email        citext,                       -- nullable: Apple may not provide it
    display_name text,
    avatar_url   text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);

CREATE UNIQUE INDEX users_email_active_uidx
    ON users (email)
    WHERE email IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE auth_identities (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    provider         text NOT NULL CHECK (provider IN ('google', 'apple')),
    provider_user_id text NOT NULL,            -- the provider's stable "sub"
    email            citext,                   -- may be an Apple private relay address
    created_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_user_id)
);

CREATE INDEX auth_identities_user_idx ON auth_identities (user_id);

CREATE TABLE refresh_tokens (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    family_id   uuid NOT NULL,                 -- one family per login; revoke all on reuse detection
    token_hash  text NOT NULL UNIQUE,          -- store a hash, never the raw token
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
CREATE TABLE profiles (
    user_id        uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    sex            text CHECK (sex IN ('male', 'female', 'other')),
    birth_date     date,
    height_cm      numeric(5,1) CHECK (height_cm > 0),
    activity_level text CHECK (activity_level IN
                       ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    unit_system    text NOT NULL DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),
    timezone       text NOT NULL DEFAULT 'UTC',  -- IANA name, e.g. Asia/Kolkata
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Versioned: insert a new row on each change so past analytics use the goal that applied then.
CREATE TABLE goals (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    calories_kcal     integer CHECK (calories_kcal > 0),
    protein_g         integer CHECK (protein_g >= 0),
    carbs_g           integer CHECK (carbs_g >= 0),
    fat_g             integer CHECK (fat_g >= 0),
    water_ml          integer CHECK (water_ml > 0),
    workouts_per_week smallint CHECK (workouts_per_week BETWEEN 0 AND 14),
    effective_from    date NOT NULL DEFAULT CURRENT_DATE,
    created_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, effective_from)
);

CREATE INDEX goals_user_effective_idx ON goals (user_id, effective_from DESC);

CREATE TABLE weight_entries (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    weight_kg  numeric(5,2) NOT NULL CHECK (weight_kg > 0),
    logged_at  timestamptz NOT NULL DEFAULT now(),
    local_date date NOT NULL
);

CREATE INDEX weight_entries_user_date_idx ON weight_entries (user_id, local_date);

-- ---------------------------------------------------------------------------
-- Workouts
-- ---------------------------------------------------------------------------
CREATE TABLE exercises (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name               text NOT NULL,
    category           text NOT NULL CHECK (category IN
                         ('strength', 'cardio', 'flexibility', 'sports', 'other')),
    muscle_group       text,
    equipment          text,
    met_value          numeric(4,1) CHECK (met_value > 0),   -- for calorie estimates
    created_by_user_id uuid REFERENCES users (id) ON DELETE CASCADE,  -- NULL = seeded
    created_at         timestamptz NOT NULL DEFAULT now()
);

-- Seeded exercise names must be unique; users may create their own with any name.
CREATE UNIQUE INDEX exercises_seed_name_uidx
    ON exercises (lower(name))
    WHERE created_by_user_id IS NULL;
CREATE INDEX exercises_name_trgm_idx    ON exercises USING gin (name gin_trgm_ops);
CREATE INDEX exercises_created_by_idx   ON exercises (created_by_user_id)
    WHERE created_by_user_id IS NOT NULL;

CREATE TABLE workouts (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    local_date      date NOT NULL,
    started_at      timestamptz NOT NULL DEFAULT now(),
    duration_min    integer CHECK (duration_min >= 0),
    name            text,
    notes           text,
    calories_burned integer CHECK (calories_burned >= 0),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX workouts_user_date_idx ON workouts (user_id, local_date);

-- One row per set; works for strength (reps/weight) and cardio (duration/distance).
-- exercise_id uses the default NO ACTION so deleting a user can still cascade through workouts.
CREATE TABLE workout_sets (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id   uuid NOT NULL REFERENCES workouts (id) ON DELETE CASCADE,
    exercise_id  uuid NOT NULL REFERENCES exercises (id),
    position     integer NOT NULL CHECK (position >= 0),
    reps         integer CHECK (reps >= 0),
    weight_kg    numeric(6,2) CHECK (weight_kg >= 0),
    duration_sec integer CHECK (duration_sec >= 0),
    distance_m   numeric(9,1) CHECK (distance_m >= 0),
    UNIQUE (workout_id, position)
);

CREATE INDEX workout_sets_exercise_idx ON workout_sets (exercise_id);

-- ---------------------------------------------------------------------------
-- Foods and meals
-- ---------------------------------------------------------------------------
-- Local catalog + cache of external providers. All nutrition values are per 100 g.
CREATE TABLE foods (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source             text NOT NULL CHECK (source IN ('usda', 'off', 'edamam', 'custom')),
    source_id          text,                    -- NULL for custom foods
    name               text NOT NULL,
    brand              text,
    barcode            text,
    serving_label      text,                    -- e.g. "1 cup", "1 slice"
    serving_g          numeric(8,2) CHECK (serving_g > 0),
    calories_100g      numeric(8,2) NOT NULL CHECK (calories_100g >= 0),
    protein_100g       numeric(8,2) CHECK (protein_100g >= 0),
    carbs_100g         numeric(8,2) CHECK (carbs_100g >= 0),
    fat_100g           numeric(8,2) CHECK (fat_100g >= 0),
    fiber_100g         numeric(8,2) CHECK (fiber_100g >= 0),
    sugar_100g         numeric(8,2) CHECK (sugar_100g >= 0),
    sodium_mg_100g     numeric(10,2) CHECK (sodium_mg_100g >= 0),
    created_by_user_id uuid REFERENCES users (id) ON DELETE CASCADE,  -- set for custom foods
    fetched_at         timestamptz NOT NULL DEFAULT now(),
    UNIQUE (source, source_id),                 -- NULL source_id rows (custom) never collide
    CHECK ((source = 'custom') = (created_by_user_id IS NOT NULL))
);

CREATE INDEX foods_name_trgm_idx  ON foods USING gin (name gin_trgm_ops);
CREATE INDEX foods_barcode_idx    ON foods (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX foods_created_by_idx ON foods (created_by_user_id)
    WHERE created_by_user_id IS NOT NULL;

CREATE TABLE meals (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    meal_type  text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    local_date date NOT NULL,
    eaten_at   timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX meals_user_date_idx ON meals (user_id, local_date);

-- Snapshot columns keep history stable even if the catalog entry changes or is removed.
CREATE TABLE meal_items (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id    uuid NOT NULL REFERENCES meals (id) ON DELETE CASCADE,
    food_id    uuid REFERENCES foods (id) ON DELETE SET NULL,
    name       text NOT NULL,
    quantity_g numeric(8,2) NOT NULL CHECK (quantity_g > 0),
    calories   numeric(8,2) NOT NULL CHECK (calories >= 0),
    protein    numeric(8,2) CHECK (protein >= 0),
    carbs      numeric(8,2) CHECK (carbs >= 0),
    fat        numeric(8,2) CHECK (fat >= 0)
);

CREATE INDEX meal_items_meal_idx ON meal_items (meal_id);
CREATE INDEX meal_items_food_idx ON meal_items (food_id) WHERE food_id IS NOT NULL;

CREATE TABLE favorite_foods (
    user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    food_id    uuid NOT NULL REFERENCES foods (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, food_id)
);

-- ---------------------------------------------------------------------------
-- Water
-- ---------------------------------------------------------------------------
CREATE TABLE water_logs (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    amount_ml  integer NOT NULL CHECK (amount_ml > 0),
    logged_at  timestamptz NOT NULL DEFAULT now(),
    local_date date NOT NULL
);

CREATE INDEX water_logs_user_date_idx ON water_logs (user_id, local_date);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER users_set_updated_at    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER workouts_set_updated_at BEFORE UPDATE ON workouts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER meals_set_updated_at    BEFORE UPDATE ON meals
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
