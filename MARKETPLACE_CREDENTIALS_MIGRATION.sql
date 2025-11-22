-- =====================================================
-- MIGRATION: Corrigir tabela marketplace_credentials
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- PASSO 1: Ver estrutura atual
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'marketplace_credentials'
ORDER BY ordinal_position;

-- PASSO 2: Criar ou recriar a tabela com TODAS as colunas necessárias
CREATE TABLE IF NOT EXISTS marketplace_credentials (
  id SERIAL PRIMARY KEY,
  marketplace TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT false,

  -- Campos comuns a vários marketplaces
  client_id TEXT,
  client_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,

  -- WooCommerce específico
  store_url TEXT,
  consumer_key TEXT,
  consumer_secret TEXT,

  -- Shopee específico
  partner_id TEXT,
  partner_key TEXT,
  shop_id TEXT,

  -- TikTok específico
  app_key TEXT,
  app_secret TEXT,

  -- Amazon específico
  seller_id TEXT,

  -- Configurações de sincronização
  auto_sync_stock BOOLEAN DEFAULT true,
  auto_sync_price BOOLEAN DEFAULT true,
  auto_sync_products BOOLEAN DEFAULT false,

  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync_at TIMESTAMP WITH TIME ZONE
);

-- PASSO 3: Se a tabela já existe, adicionar colunas que faltam
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS marketplace TEXT;
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS client_secret TEXT;
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS access_token TEXT;
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS store_url TEXT;
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS consumer_key TEXT;
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS consumer_secret TEXT;
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS partner_id TEXT;
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS partner_key TEXT;
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS shop_id TEXT;
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS app_key TEXT;
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS app_secret TEXT;
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS seller_id TEXT;
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS auto_sync_stock BOOLEAN DEFAULT true;
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS auto_sync_price BOOLEAN DEFAULT true;
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS auto_sync_products BOOLEAN DEFAULT false;
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE;

-- PASSO 4: Criar constraint UNIQUE no marketplace (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'marketplace_credentials_marketplace_key'
  ) THEN
    ALTER TABLE marketplace_credentials
    ADD CONSTRAINT marketplace_credentials_marketplace_key UNIQUE (marketplace);
  END IF;
END $$;

-- PASSO 5: Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_marketplace_credentials_marketplace ON marketplace_credentials(marketplace);
CREATE INDEX IF NOT EXISTS idx_marketplace_credentials_is_active ON marketplace_credentials(is_active);

-- PASSO 6: Verificar estrutura final
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'marketplace_credentials'
ORDER BY ordinal_position;

-- =====================================================
-- RESULTADO ESPERADO:
-- Todas as colunas devem estar presentes:
-- - marketplace, is_active
-- - client_id, client_secret, access_token, refresh_token
-- - store_url, consumer_key, consumer_secret (WooCommerce)
-- - partner_id, partner_key, shop_id (Shopee)
-- - app_key, app_secret (TikTok)
-- - seller_id (Amazon)
-- - auto_sync_stock, auto_sync_price, auto_sync_products
-- - created_at, updated_at, last_sync_at
-- =====================================================
