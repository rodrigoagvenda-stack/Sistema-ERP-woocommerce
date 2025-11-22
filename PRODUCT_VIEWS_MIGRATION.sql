-- =====================================================
-- MIGRATION: Sistema correto de visualizações
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- Criar tabela product_views (registrar cada visualização única)
CREATE TABLE IF NOT EXISTS product_views (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, session_id, DATE(viewed_at))
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_session_id ON product_views(session_id);
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at ON product_views(viewed_at);

-- Remover coluna views da tabela products (se existir)
-- Agora vamos contar views dinamicamente da tabela product_views
-- ALTER TABLE products DROP COLUMN IF EXISTS views;

-- View para contagem de visualizações por produto
CREATE OR REPLACE VIEW product_view_counts AS
SELECT 
  product_id,
  COUNT(DISTINCT session_id) as total_views,
  COUNT(DISTINCT DATE(viewed_at)) as unique_days,
  MAX(viewed_at) as last_viewed
FROM product_views
GROUP BY product_id;

-- Function para incrementar views
CREATE OR REPLACE FUNCTION increment_product_view(
  p_product_id BIGINT,
  p_session_id TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO product_views (product_id, session_id, user_agent, ip_address)
  VALUES (p_product_id, p_session_id, p_user_agent, p_ip_address)
  ON CONFLICT (product_id, session_id, DATE(viewed_at)) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICAR SE FOI CRIADO
-- =====================================================

SELECT COUNT(*) as total_views FROM product_views;
SELECT * FROM product_view_counts LIMIT 5;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
