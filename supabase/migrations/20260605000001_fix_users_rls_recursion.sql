-- Fix infinite recursion in users RLS.
--
-- The original users_admin_read_all policy queried the users table from within
-- a policy ON users, so every RLS-enforced read of users recursed and errored.
-- That broke any policy checking a role via (SELECT role FROM users ...) — e.g.
-- course browsing (UC-02) and explanation reads (UC-04). Read the role from the
-- signed JWT claim instead, which needs no table lookup and cannot recurse.

DROP POLICY IF EXISTS "users_admin_read_all" ON users;

CREATE POLICY "users_admin_read_all" ON users
	FOR SELECT USING (
		(auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
	);
