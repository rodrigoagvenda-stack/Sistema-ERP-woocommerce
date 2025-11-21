-- =====================================================
-- TABELAS PARA INTEGRAÇÃO MULTI-MARKETPLACE
-- Sistema: Lucaya Griffe E-commerce
-- =====================================================

-- 1. Tabela para armazenar credenciais dos marketplaces
CREATE TABLE IF NOT EXISTS marketplace_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  marketplace VARCHAR(50) NOT NULL, -- 'mercado_livre', 'shopee', 'tiktok', 'amazon', 'woocommerce'
  is_active BOOLEAN DEFAULT false,

  -- Credenciais (armazenadas de forma criptografada em produção)
  client_id TEXT,
  client_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,

  -- Configurações específicas
  store_url TEXT, -- Para WooCommerce
  seller_id TEXT, -- Para Amazon
  shop_id TEXT, -- Para Shopee/TikTok

  -- Configurações de sincronização
  auto_sync_stock BOOLEAN DEFAULT true,
  auto_sync_price BOOLEAN DEFAULT true,
  auto_sync_products BOOLEAN DEFAULT false,

  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(marketplace)
);

-- 2. Tabela de mapeamento: produtos locais <-> marketplaces
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Produto local
  local_product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Marketplace
  marketplace VARCHAR(50) NOT NULL,
  marketplace_product_id VARCHAR(255) NOT NULL, -- ID no marketplace
  marketplace_sku VARCHAR(255), -- SKU no marketplace (pode ser diferente)
  marketplace_url TEXT, -- Link do produto no marketplace

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'synced', 'error', 'disabled'
  last_error TEXT,

  -- Configurações específicas do marketplace
  marketplace_category_id VARCHAR(255), -- ID da categoria no marketplace
  marketplace_shipping_profile_id VARCHAR(255), -- Perfil de frete

  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(local_product_id, marketplace),
  UNIQUE(marketplace, marketplace_product_id)
);

-- 3. Tabela de logs de sincronização
CREATE TABLE IF NOT EXISTS marketplace_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Referências
  local_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  marketplace VARCHAR(50) NOT NULL,
  marketplace_product_id VARCHAR(255),

  -- Tipo de operação
  operation_type VARCHAR(30) NOT NULL, -- 'create', 'update', 'delete', 'sync_stock', 'sync_price'

  -- Status e resultado
  status VARCHAR(20) NOT NULL, -- 'success', 'error', 'pending', 'retrying'
  http_status_code INTEGER,
  error_message TEXT,
  error_details JSONB, -- Detalhes do erro em JSON

  -- Dados da sincronização
  request_payload JSONB, -- Payload enviado
  response_payload JSONB, -- Resposta recebida

  -- Retry
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,

  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Tabela para configurações de estoque por marketplace
CREATE TABLE IF NOT EXISTS marketplace_stock_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  marketplace VARCHAR(50) NOT NULL UNIQUE,

  -- Configurações de estoque
  stock_buffer INTEGER DEFAULT 0, -- Quantidade reservada (não sincronizar)
  sync_threshold INTEGER DEFAULT 0, -- Só sincronizar se diferença > threshold
  max_quantity INTEGER, -- Limite máximo a mostrar (mesmo que tenha mais)

  -- Configurações de preço
  price_markup_percentage DECIMAL(5,2) DEFAULT 0.00, -- Markup % por marketplace
  auto_adjust_price BOOLEAN DEFAULT false,

  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Índices para performance
CREATE INDEX idx_marketplace_products_local ON marketplace_products(local_product_id);
CREATE INDEX idx_marketplace_products_marketplace ON marketplace_products(marketplace, marketplace_product_id);
CREATE INDEX idx_marketplace_products_sync_status ON marketplace_products(sync_status);
CREATE INDEX idx_sync_log_product ON marketplace_sync_log(local_product_id);
CREATE INDEX idx_sync_log_marketplace ON marketplace_sync_log(marketplace);
CREATE INDEX idx_sync_log_status ON marketplace_sync_log(status);
CREATE INDEX idx_sync_log_created ON marketplace_sync_log(created_at DESC);

-- 6. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_marketplace_credentials_updated_at
    BEFORE UPDATE ON marketplace_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_products_updated_at
    BEFORE UPDATE ON marketplace_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_stock_config_updated_at
    BEFORE UPDATE ON marketplace_stock_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Row Level Security (RLS) - Segurança
ALTER TABLE marketplace_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_stock_config ENABLE ROW LEVEL SECURITY;

-- Políticas: Apenas usuários autenticados como admin podem acessar
CREATE POLICY "Admins podem ver credenciais" ON marketplace_credentials
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins podem inserir credenciais" ON marketplace_credentials
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins podem atualizar credenciais" ON marketplace_credentials
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Todos podem ver produtos de marketplace" ON marketplace_products
    FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar produtos de marketplace" ON marketplace_products
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Todos podem ver logs" ON marketplace_sync_log
    FOR SELECT USING (true);

CREATE POLICY "Sistema pode criar logs" ON marketplace_sync_log
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Todos podem ver configurações de estoque" ON marketplace_stock_config
    FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar configurações de estoque" ON marketplace_stock_config
    FOR ALL USING (auth.role() = 'authenticated');

-- 8. Dados iniciais - Configurações padrão dos marketplaces
INSERT INTO marketplace_stock_config (marketplace, stock_buffer, sync_threshold, price_markup_percentage) VALUES
  ('mercado_livre', 0, 1, 0.00),
  ('shopee', 0, 1, 0.00),
  ('tiktok', 0, 1, 0.00),
  ('amazon', 0, 1, 0.00),
  ('woocommerce', 0, 1, 0.00)
ON CONFLICT (marketplace) DO NOTHING;

-- =====================================================
-- FIM DO SCRIPT
-- Execute este script no SQL Editor do Supabase
-- =====================================================
