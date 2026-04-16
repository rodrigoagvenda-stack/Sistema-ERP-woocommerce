-- Cria bucket company-assets (público para leitura)
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Permite leitura pública dos arquivos
CREATE POLICY "Public read company-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

-- Permite upload apenas para super admins autenticados
CREATE POLICY "Super admin upload company-assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-assets'
  AND auth.role() = 'authenticated'
);

-- Permite update/delete para super admins
CREATE POLICY "Super admin manage company-assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-assets'
  AND auth.role() = 'authenticated'
);
