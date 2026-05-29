-- ENUM types
CREATE TYPE user_role AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED');

-- users table
CREATE TABLE users (
	id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	status user_status NOT NULL DEFAULT 'ACTIVE',
	role user_role NOT NULL DEFAULT 'STUDENT',
	created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- user hanya bisa lihat dan update data sendiri
CREATE POLICY "users_read_own" ON users
	FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
	FOR UPDATE USING (auth.uid() = id);

-- admin bisa lihat semua user
CREATE POLICY "users_admin_read_all" ON users
	FOR SELECT USING (
		(SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
	);