-- =====================================================
-- CORREÇÃO URGENTE: Adicionar colunas faltantes na tabela settings
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- PASSO 1: Ver estrutura atual da tabela
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'settings'
ORDER BY ordinal_position;

-- PASSO 2: Adicionar todas as colunas que faltam
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS store_name TEXT DEFAULT 'Lukaya Griffe';

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '+5511986751552';

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS store_email TEXT;

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS store_address TEXT;

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS min_stock_alert INTEGER DEFAULT 5;

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS auto_publish_products BOOLEAN DEFAULT false;

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS enable_dark_mode BOOLEAN DEFAULT false;

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS default_tax_rate DECIMAL(5,2) DEFAULT 0;

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL';

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo';

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- PASSO 3: Atualizar os valores para garantir
UPDATE settings
SET
  store_name = 'Lukaya Griffe',
  whatsapp_number = '+5511986751552',
  min_stock_alert = COALESCE(min_stock_alert, 5),
  auto_publish_products = COALESCE(auto_publish_products, false),
  enable_dark_mode = COALESCE(enable_dark_mode, false),
  default_tax_rate = COALESCE(default_tax_rate, 0),
  currency = COALESCE(currency, 'BRL'),
  timezone = COALESCE(timezone, 'America/Sao_Paulo'),
  updated_at = NOW()
WHERE id = 1;

-- PASSO 4: Verificar o resultado final
SELECT * FROM settings WHERE id = 1;

-- =====================================================
-- RESULTADO ESPERADO:
-- Todas as colunas devem existir
-- whatsapp_number = +5511986751552
-- store_name = Lukaya Griffe
-- =====================================================
