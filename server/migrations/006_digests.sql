-- ============================================================
-- NAIAN — Міграція 006: Дайджести користувача
-- ============================================================

-- digests
-- Призначення: персоналізовані дайджести користувача (щоденні/щотижневі
-- випуски новин за його підписками). АНАЛІТИЧНА СВОДКА не дублюється —
-- digests посилається на існуючу таблицю reports через report_id.
CREATE TABLE digests (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    region_id       INT REFERENCES regions(id) ON DELETE SET NULL,
    topic_id        INT REFERENCES topics(id) ON DELETE SET NULL,
    report_id       INT REFERENCES reports(id) ON DELETE SET NULL,
    title           TEXT,
    period_start    TIMESTAMP WITH TIME ZONE,
    period_end      TIMESTAMP WITH TIME ZONE,
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'scheduled', 'generating', 'published', 'failed')),
    delivery_channel VARCHAR(30) NOT NULL DEFAULT 'inapp'
                     CHECK (delivery_channel IN ('inapp', 'email', 'telegram')),
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    generated_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE digests IS 'Персоналізовані дайджести користувачів';
COMMENT ON COLUMN digests.report_id IS 'Аналітичне зведення (reports), що є основою дайджеста';
COMMENT ON COLUMN digests.status IS 'Життєвий цикл дайджеста';
COMMENT ON COLUMN digests.delivery_channel IS 'Канал доставки: inapp, email, telegram';

CREATE INDEX idx_digests_user ON digests(user_id);
CREATE INDEX idx_digests_region ON digests(region_id);
CREATE INDEX idx_digests_topic ON digests(topic_id);
CREATE INDEX idx_digests_report ON digests(report_id);
CREATE INDEX idx_digests_status ON digests(status);
CREATE INDEX idx_digests_user_created ON digests(user_id, created_at DESC);

-- digest_articles
-- Призначення: статті, включені в дайджест. Використовує articles як основну
-- новинну сутність (без дублювання полів статті).
CREATE TABLE digest_articles (
    digest_id       INT NOT NULL REFERENCES digests(id) ON DELETE CASCADE,
    article_id      INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    article_order   INT NOT NULL DEFAULT 0,
    relevance       DECIMAL(3, 2) NOT NULL DEFAULT 1.00 CHECK (relevance BETWEEN 0 AND 1),
    added_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (digest_id, article_id)
);

COMMENT ON TABLE digest_articles IS 'Статті у складі дайджеста';
COMMENT ON COLUMN digest_articles.article_order IS 'Порядок статті в дайджесті';
COMMENT ON COLUMN digest_articles.relevance IS 'Релевантність статті для користувача (0–1)';

CREATE INDEX idx_digest_articles_article ON digest_articles(article_id);