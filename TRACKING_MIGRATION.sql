-- =====================================================
-- MIGRATION: Sistema de Tracking e UTM
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- Criar tabela page_visits para tracking
CREATE TABLE IF NOT EXISTS page_visits (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  user_agent TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT, -- mobile, tablet, desktop
  browser TEXT,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_page_visits_session_id ON page_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_visited_at ON page_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_page_visits_utm_source ON page_visits(utm_source);
CREATE INDEX IF NOT EXISTS idx_page_visits_utm_campaign ON page_visits(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_page_visits_referrer ON page_visits(referrer);

-- View para analytics agregados
CREATE OR REPLACE VIEW traffic_analytics AS
SELECT
  DATE(visited_at) as visit_date,
  COUNT(*) as total_visits,
  COUNT(DISTINCT session_id) as unique_sessions,
  utm_source,
  utm_medium,
  utm_campaign,
  referrer,
  device_type
FROM page_visits
GROUP BY DATE(visited_at), utm_source, utm_medium, utm_campaign, referrer, device_type
ORDER BY visit_date DESC, total_visits DESC;

-- Function para registrar visita
CREATE OR REPLACE FUNCTION track_page_visit(
  p_session_id TEXT,
  p_page_url TEXT,
  p_referrer TEXT DEFAULT NULL,
  p_utm_source TEXT DEFAULT NULL,
  p_utm_medium TEXT DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL,
  p_utm_term TEXT DEFAULT NULL,
  p_utm_content TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO page_visits (
    session_id, page_url, referrer,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    user_agent, ip_address
  )
  VALUES (
    p_session_id, p_page_url, p_referrer,
    p_utm_source, p_utm_medium, p_utm_campaign, p_utm_term, p_utm_content,
    p_user_agent, p_ip_address
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICAR
-- =====================================================
SELECT COUNT(*) as total_visits FROM page_visits;
SELECT * FROM traffic_analytics LIMIT 10;
