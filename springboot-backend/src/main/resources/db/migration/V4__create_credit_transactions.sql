-- V4: Credit transactions table
-- Immutable audit log of all credit movements (grants, deductions, top-ups)

CREATE TABLE credit_transactions (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_id UUID         REFERENCES analyses(id) ON DELETE SET NULL,
    delta       INT          NOT NULL,   -- positive = added, negative = deducted
    reason      VARCHAR(100) NOT NULL,   -- 'WELCOME_GRANT', 'ANALYSIS_DEDUCT', 'TOPUP_PACK_5', etc.
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_tx_user_id    ON credit_transactions(user_id);
CREATE INDEX idx_credit_tx_created_at ON credit_transactions(created_at DESC);

-- Helpful view: running balance per user (for debugging / admin)
CREATE VIEW user_credit_balance AS
SELECT
    user_id,
    SUM(delta) AS balance,
    COUNT(*) FILTER (WHERE delta < 0) AS total_analyses
FROM credit_transactions
GROUP BY user_id;
