CREATE TABLE audit_log (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	admin_id UUID NOT NULL REFERENCES users(id),
	target_id UUID NOT NULL,
	action TEXT NOT NULL,
	reason TEXT,
	timestamp TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- hanya admin yang bisa read audit log
CREATE POLICY "audit_log_admin_read" ON audit_log
	FOR SELECT USING (
		(SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
	);

-- audit log append-only, tidak ada update atau delete (NFR-11)
CREATE POLICY "audit_log_admin_insert" ON audit_log
	FOR INSERT WITH CHECK (
		(SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
	);