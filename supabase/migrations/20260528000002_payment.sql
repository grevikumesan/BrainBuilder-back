--plans
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

CREATE TABLE plans (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name TEXT NOT NULL,
	price NUMERIC(10, 2) NOT NULL,
	duration_days INT NOT NULL,
	created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subscriptions (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	plan_id UUID NOT NULL REFERENCES plans(id),
	status subscription_status NOT NULL DEFAULT 'INACTIVE',
	start_date TIMESTAMPTZ,
	expires_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE transactions (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	order_id TEXT NOT NULL UNIQUE,
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	plan_id UUID NOT NULL REFERENCES plans(id),
	amount NUMERIC(10, 2) NOT NULL,
	status transaction_status NOT NULL DEFAULT 'PENDING',
	created_at TIMESTAMPTZ DEFAULT now()
);

--RLS (NFR-01)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

--plans: semua user bisa read
CREATE POLICY "plans_read_all" ON plans
	FOR SELECT USING (true);

--subscriptions: student hanya bisa lihat miliknya sendiri
CREATE POLICY "subscriptions_read_own" ON subscriptions
	FOR SELECT USING (auth.uid() = user_id);

--transactions: student hanya bisa lihat miliknya sendiri
CREATE POLICY "transactions_read_own" ON transactions
	FOR SELECT USING (auth.uid() = user_id);