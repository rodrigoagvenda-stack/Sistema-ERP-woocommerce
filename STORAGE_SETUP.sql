-- =====================================================
-- SQL para configurar Supabase Storage para produtos
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. CRIAR BUCKET para imagens de produtos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICAS DE ACESSO

-- Permitir upload para usuários autenticados
CREATE POLICY "Autenticados podem fazer upload de imagens de produtos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Permitir leitura pública (qualquer um pode ver as imagens)
CREATE POLICY "Imagens de produtos são públicas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Permitir atualização para usuários autenticados
CREATE POLICY "Autenticados podem atualizar imagens de produtos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- Permitir deleção para usuários autenticados
CREATE POLICY "Autenticados podem deletar imagens de produtos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- 3. VERIFICAR SE AS POLÍTICAS RLS ESTÃO CORRETAS PARA PRODUTOS

-- Ver políticas atuais
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('products', 'categories')
ORDER BY tablename, policyname;

-- Se necessário, criar políticas básicas para products:
-- (Descomente apenas se ainda não tiver políticas)

/*
-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Permitir SELECT para todos
CREATE POLICY "Produtos são públicos para leitura"
ON products FOR SELECT
TO public
USING (true);

-- Permitir INSERT/UPDATE/DELETE para autenticados
CREATE POLICY "Autenticados podem gerenciar produtos"
ON products FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
*/

-- 4. VERIFICAR SCHEMA DA TABELA PRODUCTS

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- 5. SE NECESSÁRIO, AJUSTAR COLUNAS
-- (Execute apenas se os campos não existirem ou estiverem errados)

/*
-- Garantir que image_urls existe (compatibilidade com código antigo)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS image_urls TEXT;

-- Se quiser migrar para image_url (singular), fazer depois:
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
-- UPDATE products SET image_url = image_urls WHERE image_url IS NULL;

-- Garantir que available_sizes existe
ALTER TABLE products
ADD COLUMN IF NOT EXISTS available_sizes TEXT[];

-- Garantir que price é numérico
ALTER TABLE products
ALTER COLUMN price TYPE NUMERIC(10,2);
*/

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- APÓS EXECUTAR ESTE SCRIPT:
-- 1. Vá em Storage → Buckets
-- 2. Verifique se 'product-images' aparece
-- 3. Teste fazer upload de uma imagem
-- 4. Se funcionar, pronto! ✅
