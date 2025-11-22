-- =====================================================
-- CORREÇÃO URGENTE: Atualizar número WhatsApp
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- Atualizar o número do WhatsApp na tabela settings
UPDATE settings
SET whatsapp_number = '+5511986751552',
    updated_at = NOW()
WHERE id = 1;

-- Verificar se foi atualizado
SELECT id, store_name, whatsapp_number, updated_at
FROM settings
WHERE id = 1;

-- =====================================================
-- RESULTADO ESPERADO:
-- whatsapp_number deve ser: +5511986751552
-- =====================================================
