-- Adiciona flag para identificar empresas que usam WooCommerce
ALTER TABLE companies ADD COLUMN IF NOT EXISTS has_woocommerce BOOLEAN DEFAULT false;

-- Marca as empresas WooCommerce
UPDATE companies SET has_woocommerce = true WHERE slug IN ('geezer', 'agro');
