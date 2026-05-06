-- 003: tabela de estilos de produto
CREATE TABLE IF NOT EXISTS styles (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS styles_name_company_idx ON styles (name, company_id);

ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_isolation ON styles
  USING (company_id = get_my_company_id())
  WITH CHECK (company_id = get_my_company_id());
