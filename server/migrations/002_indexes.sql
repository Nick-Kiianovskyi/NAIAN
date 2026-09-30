-- ============================================================
-- NAIAN — Індекси для оптимізації продуктивності
-- Міграція 002: Індекси
-- ============================================================

-- articles
CREATE INDEX IF NOT EXISTS idx_articles_region_id ON articles(region_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_fetched_at ON articles(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_content_hash ON articles(content_hash) WHERE content_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_is_duplicate ON articles(is_duplicate) WHERE is_duplicate = FALSE;
CREATE INDEX IF NOT EXISTS idx_articles_url_hash ON articles USING hash(url);
CREATE INDEX IF NOT EXISTS idx_articles_region_published ON articles(region_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_metadata ON articles USING gin(metadata);

-- ai_analysis
CREATE INDEX IF NOT EXISTS idx_ai_analysis_article_id ON ai_analysis(article_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_sentiment ON ai_analysis(sentiment);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_analyzed_at ON ai_analysis(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_entities ON ai_analysis USING gin(entities);

-- events
CREATE INDEX IF NOT EXISTS idx_events_region_id ON events(region_id);
CREATE INDEX IF NOT EXISTS idx_events_importance_score ON events(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_events_significance ON events(significance);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_date_range ON events USING gist(date_range);
CREATE INDEX IF NOT EXISTS idx_events_region_importance ON events(region_id, importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_events_importance_factors ON events USING gin(importance_factors);

-- event_sources
CREATE INDEX IF NOT EXISTS idx_event_sources_event_id ON event_sources(event_id);
CREATE INDEX IF NOT EXISTS idx_event_sources_article_id ON event_sources(article_id);

-- event_locations
CREATE INDEX IF NOT EXISTS idx_event_locations_event_id ON event_locations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_locations_city ON event_locations(city);
CREATE INDEX IF NOT EXISTS idx_event_locations_lat_lng ON event_locations(lat, lng);
CREATE INDEX IF NOT EXISTS idx_event_locations_place_type ON event_locations(place_type);

-- event_mentions
CREATE INDEX IF NOT EXISTS idx_event_mentions_event_id ON event_mentions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_mentions_date ON event_mentions(mention_date DESC);
CREATE INDEX IF NOT EXISTS idx_event_mentions_trend ON event_mentions(trend_direction);

-- reports
CREATE INDEX IF NOT EXISTS idx_reports_region_id ON reports(region_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_period ON reports(period_start, period_end);

-- report_topics
CREATE INDEX IF NOT EXISTS idx_report_topics_report_id ON report_topics(report_id);

-- report_events
CREATE INDEX IF NOT EXISTS idx_report_events_report_id ON report_events(report_id);

-- trend_snapshots
CREATE INDEX IF NOT EXISTS idx_trend_snapshots_region_id ON trend_snapshots(region_id);
CREATE INDEX IF NOT EXISTS idx_trend_snapshots_topic_id ON trend_snapshots(topic_id);
CREATE INDEX IF NOT EXISTS idx_trend_snapshots_date ON trend_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_trend_snapshots_region_date ON trend_snapshots(region_id, snapshot_date DESC);

-- trend_alerts
CREATE INDEX IF NOT EXISTS idx_trend_alerts_region_id ON trend_alerts(region_id);
CREATE INDEX IF NOT EXISTS idx_trend_alerts_is_read ON trend_alerts(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_trend_alerts_created_at ON trend_alerts(created_at DESC);

-- chat_sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_region_id ON chat_sessions(region_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);

-- chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- import_log
CREATE INDEX IF NOT EXISTS idx_import_log_region_id ON import_log(region_id);
CREATE INDEX IF NOT EXISTS idx_import_log_status ON import_log(status);
CREATE INDEX IF NOT EXISTS idx_import_log_started_at ON import_log(started_at DESC);