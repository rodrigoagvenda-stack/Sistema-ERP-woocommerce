-- =====================================================
-- SQL para Novas Funcionalidades E-commerce
-- Lukaya Griffe - Sistema de Banners e Configurações
-- =====================================================

-- ============= TABELA DE BANNERS =============
CREATE TABLE IF NOT EXISTS banners (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  image_url_mobile TEXT, -- Imagem específica para mobile
  link_url TEXT,
  button_text VARCHAR(100),
  is_active BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_banners_active ON banners(is_active);
CREATE INDEX idx_banners_order ON banners(order_index);
CREATE INDEX idx_banners_dates ON banners(start_date, end_date);

-- RLS (Row Level Security) para banners
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ver banners ativos
CREATE POLICY "Banners ativos são públicos"
ON banners FOR SELECT
TO public
USING (is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));

-- Política: Autenticados podem ver todos os banners
CREATE POLICY "Autenticados podem ver todos os banners"
ON banners FOR SELECT
TO authenticated
USING (true);

-- Política: Apenas autenticados podem criar banners
CREATE POLICY "Apenas autenticados podem criar banners"
ON banners FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: Apenas autenticados podem atualizar banners
CREATE POLICY "Apenas autenticados podem atualizar banners"
ON banners FOR UPDATE
TO authenticated
USING (true);

-- Política: Apenas autenticados podem deletar banners
CREATE POLICY "Apenas autenticados podem deletar banners"
ON banners FOR DELETE
TO authenticated
USING (true);


-- ============= TABELA DE CONFIGURAÇÕES =============
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1, -- Apenas 1 registro
  dark_mode BOOLEAN DEFAULT false,
  featured_category_id BIGINT REFERENCES categories(id),
  show_new_badge_days INTEGER DEFAULT 7, -- Produtos novos têm badge por X dias
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Inserir configuração padrão
INSERT INTO settings (id, dark_mode, show_new_badge_days)
VALUES (1, false, 7)
ON CONFLICT (id) DO NOTHING;

-- RLS para settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler settings
CREATE POLICY "Settings são públicas"
ON settings FOR SELECT
TO public
USING (true);

-- Política: Apenas autenticados podem atualizar settings
CREATE POLICY "Apenas autenticados podem atualizar settings"
ON settings FOR UPDATE
TO authenticated
USING (id = 1);


-- ============= NOVOS CAMPOS EM PRODUTOS =============
-- Adicionar campos para badges e destaque
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS badge_text VARCHAR(50),
ADD COLUMN IF NOT EXISTS badge_color VARCHAR(20) DEFAULT 'yellow',
ADD COLUMN IF NOT EXISTS related_product_ids BIGINT[];

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_new ON products(is_new) WHERE is_new = true;
CREATE INDEX IF NOT EXISTS idx_products_discount ON products(discount_percentage) WHERE discount_percentage > 0;

-- Comentários explicativos
COMMENT ON COLUMN products.is_featured IS 'Produto em destaque na home';
COMMENT ON COLUMN products.is_new IS 'Produto novo (badge)';
COMMENT ON COLUMN products.discount_percentage IS 'Porcentagem de desconto (0-100)';
COMMENT ON COLUMN products.original_price IS 'Preço original antes do desconto';
COMMENT ON COLUMN products.badge_text IS 'Texto customizado do badge (ex: BLACK FRIDAY)';
COMMENT ON COLUMN products.badge_color IS 'Cor do badge (yellow, red, blue, green, etc)';
COMMENT ON COLUMN products.related_product_ids IS 'IDs de produtos relacionados para cross-sell';


-- ============= FUNÇÃO PARA AUTO-GERENCIAR BADGES "NOVO" =============
-- Automaticamente marca produtos como novos baseado na data de criação
CREATE OR REPLACE FUNCTION update_new_badge()
RETURNS TRIGGER AS $$
DECLARE
  days_to_show_new INTEGER;
BEGIN
  -- Pegar quantos dias mostrar o badge de novo
  SELECT show_new_badge_days INTO days_to_show_new FROM settings WHERE id = 1;

  -- Se o produto foi criado há menos de X dias, marcar como novo
  IF NEW.created_at >= NOW() - INTERVAL '1 day' * days_to_show_new THEN
    NEW.is_new := true;
  ELSE
    NEW.is_new := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar badge "novo" ao inserir produto
CREATE TRIGGER trigger_update_new_badge_on_insert
BEFORE INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION update_new_badge();


-- ============= VIEWS ÚTEIS =============

-- View de produtos em destaque
CREATE OR REPLACE VIEW featured_products AS
SELECT * FROM products
WHERE is_featured = true AND status = 'active'
ORDER BY views DESC, created_at DESC;

-- View de produtos novos
CREATE OR REPLACE VIEW new_products AS
SELECT * FROM products
WHERE is_new = true AND status = 'active'
ORDER BY created_at DESC;

-- View de produtos em promoção
CREATE OR REPLACE VIEW promo_products AS
SELECT * FROM products
WHERE discount_percentage > 0 AND status = 'active'
ORDER BY discount_percentage DESC, created_at DESC;


-- ============= DADOS DE EXEMPLO =============

-- Banner de exemplo
INSERT INTO banners (title, description, image_url, button_text, is_active, order_index)
VALUES (
  'Coleção Verão 2025',
  'Novas peças exclusivas chegando!',
  'https://via.placeholder.com/1920x600/FFD700/333333?text=Cole%C3%A7%C3%A3o+Ver%C3%A3o+2025',
  'Ver Coleção',
  true,
  1
)
ON CONFLICT DO NOTHING;

-- Marcar alguns produtos como destaque (caso existam)
UPDATE products
SET is_featured = true
WHERE id IN (
  SELECT id FROM products
  WHERE status = 'active'
  ORDER BY views DESC
  LIMIT 4
);

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- Para aplicar, execute no SQL Editor do Supabase Dashboard
