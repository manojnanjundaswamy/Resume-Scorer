-- V1: Users table
-- Stores authenticated users (Google or Apple Sign-In)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email             VARCHAR(255) NOT NULL UNIQUE,
    name              VARCHAR(255),
    profile_picture   TEXT,
    auth_provider     VARCHAR(20)  NOT NULL,   -- 'GOOGLE' or 'APPLE'
    external_id       VARCHAR(255) NOT NULL,   -- Google sub / Apple sub
    credits_remaining INT         NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_provider_external UNIQUE (auth_provider, external_id)
);

CREATE INDEX idx_users_email ON users(email);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
