-- =====================================================
-- Migração: Adicionar suporte para 3 formatos de banner
-- Desktop (1920x600), Tablet (1024x500), Mobile (768x400)
-- =====================================================

-- Adicionar coluna para imagem tablet
ALTER TABLE banners
ADD COLUMN IF NOT EXISTS image_url_tablet TEXT;

-- Renomear colunas para ficar mais claro
-- Nota: Se já tem dados, copie image_url para image_url_desktop primeiro
ALTER TABLE banners
ADD COLUMN IF NOT EXISTS image_url_desktop TEXT;

-- Copiar dados existentes de image_url para image_url_desktop
UPDATE banners
SET image_url_desktop = image_url
WHERE image_url_desktop IS NULL;

-- Comentários para documentação
COMMENT ON COLUMN banners.image_url IS 'DEPRECATED - Use image_url_desktop';
COMMENT ON COLUMN banners.image_url_desktop IS 'Imagem para desktop (1920x600)';
COMMENT ON COLUMN banners.image_url_tablet IS 'Imagem para tablet (1024x500)';
COMMENT ON COLUMN banners.image_url_mobile IS 'Imagem para mobile (768x400)';

-- =====================================================
-- Configuração do Supabase Storage
-- Execute os comandos abaixo no SQL Editor do Supabase
-- =====================================================

-- Criar bucket para banners (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Política: Permitir upload público (qualquer um autenticado)
CREATE POLICY "Autenticados podem fazer upload de banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'banners');

-- Política: Permitir leitura pública
CREATE POLICY "Banners são públicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'banners');

-- Política: Permitir atualização por autenticados
CREATE POLICY "Autenticados podem atualizar banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'banners');

-- Política: Permitir deleção por autenticados
CREATE POLICY "Autenticados podem deletar banners"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'banners');

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
