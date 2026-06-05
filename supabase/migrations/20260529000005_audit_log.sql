CREATE TABLE audit_log (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	admin_id UUID NOT NULL REFERENCES users(id),
	target_id UUID NOT NULL,
	action TEXT NOT NULL,
	reason TEXT,
	timestamp TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- only admins can read the audit log
CREATE POLICY "audit_log_admin_read" ON audit_log
	FOR SELECT USING (
		(SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
	);

-- audit log is append-only: no update or delete policy is defined (NFR-11)
CREATE POLICY "audit_log_admin_insert" ON audit_log
	FOR INSERT WITH CHECK (
		(SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
	);