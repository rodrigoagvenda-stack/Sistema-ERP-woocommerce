-- ================================================
-- GEEZER ERP - Migration 001
-- Expansão do módulo WooCommerce
-- ================================================

-- Expandir tabela categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS woo_id INTEGER;

-- Expandir tabela products
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS woo_tags INTEGER[];

-- ================================================
-- Nova tabela: brands
-- ================================================
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  woo_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- Nova tabela: tags
-- ================================================
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  woo_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- Nova tabela: attributes
-- ================================================
CREATE TABLE IF NOT EXISTS attributes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  woo_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- Nova tabela: attribute_terms
-- ================================================
CREATE TABLE IF NOT EXISTS attribute_terms (
  id SERIAL PRIMARY KEY,
  attribute_id INTEGER REFERENCES attributes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  woo_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- Nova tabela: reviews (somente leitura do WooCommerce)
-- ================================================
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  woo_id INTEGER UNIQUE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  reviewer_name TEXT,
  reviewer_email TEXT,
  review TEXT,
  status TEXT DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- Nova tabela: analytics_settings
-- ================================================
CREATE TABLE IF NOT EXISTS analytics_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  default_period INTEGER DEFAULT 30,
  revenue_goal NUMERIC(12,2) DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  sync_interval INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir registro padrão de configurações de analytics
INSERT INTO analytics_settings (id, default_period, revenue_goal, low_stock_threshold, sync_interval)
VALUES (1, 30, 0, 5, 10)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- Expandir marketplace_sync_log
-- ================================================
ALTER TABLE marketplace_sync_log ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE marketplace_sync_log ADD COLUMN IF NOT EXISTS entity_id TEXT;

-- ================================================
-- Índices de performance
-- ================================================
CREATE INDEX IF NOT EXISTS idx_brands_woo_id ON brands(woo_id);
CREATE INDEX IF NOT EXISTS idx_tags_woo_id ON tags(woo_id);
CREATE INDEX IF NOT EXISTS idx_attributes_woo_id ON attributes(woo_id);
CREATE INDEX IF NOT EXISTS idx_attribute_terms_attribute_id ON attribute_terms(attribute_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_woo_id ON reviews(woo_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_woo_id ON categories(woo_id);
