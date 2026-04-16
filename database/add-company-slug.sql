-- ============================================================
-- VendAgro — Slug por empresa para URL de login personalizada
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Adiciona slug na tabela companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Define slugs iniciais
UPDATE companies SET slug = 'geezer' WHERE name = 'Geezer';
UPDATE companies SET slug = 'agro'   WHERE name = 'VendAgro';

-- 3. Policy pública para lookup por slug (sem autenticação)
--    Necessário para exibir branding na página de login antes do usuário logar
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_slug_lookup ON companies;
CREATE POLICY public_slug_lookup ON companies
  FOR SELECT
  USING (true);
-- Obs: a policy company_self e super_admin_companies cobrem INSERT/UPDATE/DELETE
-- Esta policy só libera SELECT para todos (dados de branding não são sensíveis)
