-- =====================================================
-- CORREÇÃO URGENTE: Adicionar e atualizar número WhatsApp
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- PASSO 1: Adicionar a coluna whatsapp_number se não existir
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '+5511986751552';

-- PASSO 2: Atualizar o número do WhatsApp
UPDATE settings
SET whatsapp_number = '+5511986751552',
    updated_at = NOW()
WHERE id = 1;

-- PASSO 3: Verificar a estrutura da tabela
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'settings'
ORDER BY ordinal_position;

-- PASSO 4: Verificar o valor atualizado
SELECT id, store_name, whatsapp_number, updated_at
FROM settings
WHERE id = 1;

-- =====================================================
-- RESULTADO ESPERADO:
-- whatsapp_number deve aparecer nas colunas e ter valor: +5511986751552
-- =====================================================
