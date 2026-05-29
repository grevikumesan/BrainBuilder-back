--FK for users table (UC-01)
ALTER TABLE subscriptions
	ADD CONSTRAINT fk_subscriptions_user
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE transactions
	ADD CONSTRAINT fk_transactions_user
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;