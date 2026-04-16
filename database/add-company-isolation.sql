-- ============================================================
-- VendAgro — Multi-tenant isolation por company_id
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Tabela de empresas
CREATE TABLE IF NOT EXISTS companies (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Perfis: vincula auth.user → company
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Adiciona company_id nas tabelas de dados
ALTER TABLE products              ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE categories            ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE brands                ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE tags                  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE attributes            ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE attribute_terms       ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE reviews               ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE marketplace_credentials ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE analytics_settings    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE marketplace_sync_log  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 4. Função helper — retorna company_id do usuário logado
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$;

-- 5. Habilita RLS nas tabelas
ALTER TABLE products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_terms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews                ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_sync_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;

-- 6. Policies — cada tabela só enxerga dados da própria empresa
DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'products','categories','brands','tags','attributes',
    'attribute_terms','reviews','marketplace_credentials',
    'analytics_settings','marketplace_sync_log'
  ]
  LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS company_isolation ON %I;
      CREATE POLICY company_isolation ON %I
        USING (company_id = get_my_company_id())
        WITH CHECK (company_id = get_my_company_id());
    ', t, t);
  END LOOP;
END $$;

-- profiles: usuário só vê o próprio perfil
DROP POLICY IF EXISTS own_profile ON profiles;
CREATE POLICY own_profile ON profiles
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 7. ============================================================
-- SETUP INICIAL — rode isso UMA VEZ para criar a sua empresa
-- e vincular o usuário existente
-- ============================================================

-- Cria a empresa
INSERT INTO companies (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'VendAgro')
ON CONFLICT (id) DO NOTHING;

-- Vincula TODOS os usuários auth existentes a essa empresa
-- (ajuste o company_id se criar um UUID diferente acima)
INSERT INTO profiles (id, company_id)
SELECT id, '00000000-0000-0000-0000-000000000001'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Preenche company_id nos registros já existentes de cada tabela
UPDATE products              SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE categories            SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE brands                SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE tags                  SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE attributes            SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE attribute_terms       SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE reviews               SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE marketplace_credentials SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE analytics_settings    SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE marketplace_sync_log  SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
