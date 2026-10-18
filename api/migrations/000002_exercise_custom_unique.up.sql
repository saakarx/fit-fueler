-- 000002_exercise_custom_unique.up.sql
-- A user cannot have two active custom exercises with the same name (case-insensitive).
-- Catalog (wger) exercises are not covered: wger legitimately has repeated names.

CREATE UNIQUE INDEX exercises_custom_name_uidx
    ON exercises (created_by_user_id, lower(name))
    WHERE source = 'custom' AND NOT is_deleted;
