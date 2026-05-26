-- V3: Analyses table
-- Stores the full AI analysis result for a resume (optionally against a JD)

CREATE TABLE analyses (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id       UUID         NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overall_score   INT,                           -- 0–100
    grade           VARCHAR(10),                   -- A+, A, B+, …
    ai_provider     VARCHAR(50)  NOT NULL,          -- CLAUDE, GEMINI, OPENAI, OPENROUTER
    job_description TEXT,                          -- optional JD supplied by user
    result_json     JSONB        NOT NULL,          -- full AnalysisResult payload
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analyses_user_id     ON analyses(user_id);
CREATE INDEX idx_analyses_resume_id   ON analyses(resume_id);
CREATE INDEX idx_analyses_created_at  ON analyses(created_at DESC);

-- GIN index for JSONB queries (future feature expansion)
CREATE INDEX idx_analyses_result_gin  ON analyses USING GIN (result_json);
