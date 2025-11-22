-- =====================================================
-- MIGRATION: Criar tabela de configurações
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- Criar tabela settings
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  store_name TEXT DEFAULT 'Lukaya Griffe',
  store_email TEXT,
  store_address TEXT,
  whatsapp_number TEXT DEFAULT '+5511986751552',
  min_stock_alert INTEGER DEFAULT 5,
  auto_publish_products BOOLEAN DEFAULT false,
  enable_dark_mode BOOLEAN DEFAULT false,
  default_tax_rate DECIMAL(5,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT settings_single_row CHECK (id = 1)
);

-- Inserir configurações padrão
INSERT INTO settings (id, store_name, whatsapp_number)
VALUES (1, 'Lukaya Griffe', '+5511986751552')
ON CONFLICT (id) DO NOTHING;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_settings_updated_at ON settings(updated_at);

-- =====================================================
-- VERIFICAR
-- =====================================================
SELECT * FROM settings;
