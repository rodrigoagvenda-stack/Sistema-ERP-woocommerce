-- ============================================================
-- VendAgro — Branding e features por empresa
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Campos de branding e features na tabela companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url        TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS favicon_url     TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS primary_color   TEXT DEFAULT '#15A344';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS feature_payments BOOLEAN DEFAULT true;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS feature_shipping BOOLEAN DEFAULT true;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS feature_coupons  BOOLEAN DEFAULT true;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS feature_site     BOOLEAN DEFAULT true;

-- 2. Super admin flag no profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- 3. Marca o super admin (substitua pelo email correto)
UPDATE profiles
SET is_super_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'rodrigo@vendai.com.br');

-- 4. RLS na tabela companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Empresa só vê a si mesma
DROP POLICY IF EXISTS company_self ON companies;
CREATE POLICY company_self ON companies
  FOR ALL
  USING (id = get_my_company_id())
  WITH CHECK (id = get_my_company_id());

-- Super admin vê e edita todas
DROP POLICY IF EXISTS super_admin_companies ON companies;
CREATE POLICY super_admin_companies ON companies
  FOR ALL
  USING ((SELECT is_super_admin FROM profiles WHERE id = auth.uid()))
  WITH CHECK ((SELECT is_super_admin FROM profiles WHERE id = auth.uid()));

-- Super admin vê todos os profiles
DROP POLICY IF EXISTS super_admin_profiles ON profiles;
CREATE POLICY super_admin_profiles ON profiles
  FOR SELECT
  USING ((SELECT is_super_admin FROM profiles WHERE id = auth.uid()));

-- 5. Dados iniciais de branding (ajuste as URLs)
UPDATE companies SET
  logo_url      = 'https://lnzxjtzquxhxdlqqenjo.supabase.co/storage/v1/object/public/media/Logo%20VendAgro2.png',
  favicon_url   = 'https://lnzxjtzquxhxdlqqenjo.supabase.co/storage/v1/object/public/media/Fivecon%20(2).png',
  primary_color = '#15A344',
  feature_payments = false,
  feature_shipping = false,
  feature_coupons  = false,
  feature_site     = false
WHERE name = 'VendAgro';

UPDATE companies SET
  primary_color    = '#f4b522',
  feature_payments = true,
  feature_shipping = true,
  feature_coupons  = true,
  feature_site     = true
WHERE name = 'Geezer';
