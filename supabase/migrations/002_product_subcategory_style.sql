-- 002: adiciona subcategoria e estilo ao produto
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory_id INTEGER REFERENCES categories(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS style TEXT;
