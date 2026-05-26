-- V2: Resumes table
-- Each uploaded resume file; references the owning user

CREATE TABLE resumes (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name   VARCHAR(512) NOT NULL,
    s3_key          TEXT         NOT NULL UNIQUE,
    file_size_bytes BIGINT       NOT NULL,
    content_type    VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    uploaded_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_uploaded_at ON resumes(uploaded_at DESC);
