-- =====================================================
-- MIGRATION: Adicionar controle de estoque
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- Adicionar campos de estoque na tabela products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 5;

-- Atualizar produtos existentes com estoque padrão
UPDATE products
SET stock = 50, min_stock = 5
WHERE stock IS NULL;

-- Criar índice para consultas rápidas de produtos sem estoque
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- =====================================================
-- VERIFICAR SE OS CAMPOS FORAM CRIADOS
-- =====================================================

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('stock', 'min_stock')
ORDER BY ordinal_position;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
