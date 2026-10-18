-- 000003_exercise_language.up.sql
-- Stores the language of each exercise's name. The wger importer only imports
-- English, so existing and new rows are 'en'. The value is a lowercase language
-- code such as 'en' or 'pt-br'.

ALTER TABLE exercises
    ADD COLUMN language text NOT NULL DEFAULT 'en'
    CONSTRAINT exercises_language_chk CHECK (language ~ '^[a-z]{2,3}(-[a-z0-9]{2,8})*$');
