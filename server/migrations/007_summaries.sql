-- ============================================================
-- NAIAN — Міграція 007: Версійовані AI-зведення статей
-- ============================================================

-- summaries
-- Призначення: історія генерацій коротких зведень статей (версіонування,
-- порівняння моделей, облік токенів). articles.summary зберігає ПОТОЧНЕ
-- кешоване зведення, а ця таблиця — повний лог попередніх версій.
-- Не дублює ai_analysis: там аналіз (сутності, тональність), тут — зведення
-- контенту для дайджестів і розсилок.
CREATE TABLE summaries (
    id              SERIAL PRIMARY KEY,
    article_id      INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    summary_type    VARCHAR(30) NOT NULL DEFAULT 'short'
                    CHECK (summary_type IN ('short', 'extended', 'digest')),
    content         TEXT NOT NULL,
    model_used      VARCHAR(100),
    prompt_version  VARCHAR(50),
    tokens_used     INT,
    quality_score   DECIMAL(3, 2) CHECK (quality_score BETWEEN 0 AND 1),
    status          VARCHAR(20) NOT NULL DEFAULT 'success'
                    CHECK (status IN ('pending', 'success', 'failed')),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE summaries IS 'Версійовані AI-зведення статей';
COMMENT ON COLUMN summaries.summary_type IS 'Тип зведення: коротке, розширене, для дайджеста';
COMMENT ON COLUMN summaries.prompt_version IS 'Версія промпту, що згенерувала зведення';
COMMENT ON COLUMN summaries.quality_score IS 'Оцінка якості зведення (0–1)';

CREATE INDEX idx_summaries_article ON summaries(article_id);
CREATE INDEX idx_summaries_created ON summaries(created_at DESC);
CREATE INDEX idx_summaries_article_created ON summaries(article_id, created_at DESC);
CREATE INDEX idx_summaries_type ON summaries(summary_type);
CREATE INDEX idx_summaries_success ON summaries(status) WHERE status = 'success';