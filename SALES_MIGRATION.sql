-- =====================================================
-- MIGRATION: Sistema de Vendas WhatsApp
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- Criar tabela customers
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  source TEXT DEFAULT 'whatsapp', -- whatsapp, website, marketplace
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para customers
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_source ON customers(source);

-- Criar tabela sales
CREATE TABLE IF NOT EXISTS sales (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT, -- pix, boleto, cartao, whatsapp, etc
  status TEXT DEFAULT 'pending', -- pending, paid, cancelled, shipped, delivered
  source TEXT DEFAULT 'whatsapp', -- whatsapp, website, marketplace
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para sales
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_source ON sales(source);

-- Criar tabela sale_items
CREATE TABLE IF NOT EXISTS sale_items (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para sale_items
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- View para vendas com detalhes
CREATE OR REPLACE VIEW sales_with_details AS
SELECT
  s.id as sale_id,
  s.total_amount,
  s.payment_method,
  s.status,
  s.source,
  s.created_at,
  c.name as customer_name,
  c.phone as customer_phone,
  c.email as customer_email,
  COUNT(si.id) as items_count,
  SUM(si.quantity) as total_items_quantity
FROM sales s
JOIN customers c ON s.customer_id = c.id
LEFT JOIN sale_items si ON s.id = si.sale_id
GROUP BY s.id, c.id
ORDER BY s.created_at DESC;

-- Function para diminuir estoque
CREATE OR REPLACE FUNCTION decrease_product_stock(
  p_product_id BIGINT,
  p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(stock - p_quantity, 0),
      updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Function para aumentar estoque (devolução/cancelamento)
CREATE OR REPLACE FUNCTION increase_product_stock(
  p_product_id BIGINT,
  p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = stock + p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICAR
-- =====================================================
SELECT COUNT(*) as total_customers FROM customers;
SELECT COUNT(*) as total_sales FROM sales;
SELECT COUNT(*) as total_sale_items FROM sale_items;
SELECT * FROM sales_with_details LIMIT 5;
