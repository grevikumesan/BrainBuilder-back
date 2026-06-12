-- UC-07 Payment Process

-- One subscription row per user so the webhook upsert UPDATES the existing
-- row instead of inserting a duplicate on every successful payment, giving the
-- idempotent state transition the payment callback relies on (NFR-03).
ALTER TABLE subscriptions
	ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);

-- Seed default subscription plans so payment-create (FR-09 Initiate Purchase)
-- has plans to charge against. Idempotent so re-running migrations is safe.
INSERT INTO plans (name, price, duration_days)
SELECT 'Monthly', 49000, 30
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Monthly');

INSERT INTO plans (name, price, duration_days)
SELECT 'Yearly', 490000, 365
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Yearly');
