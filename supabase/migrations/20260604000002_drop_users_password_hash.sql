-- Passwords are handled by Supabase Auth (auth.users), so the legacy
-- password_hash column on public.users is unused. Its NOT NULL constraint
-- broke registration ("null value in column password_hash violates not-null
-- constraint"). Drop it to match the application code (UC-01).
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
