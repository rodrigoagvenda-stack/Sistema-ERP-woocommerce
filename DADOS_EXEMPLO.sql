-- ================================================
-- DADOS DE EXEMPLO PARA LUKAYA GRIFFE
-- ================================================
-- Execute este arquivo no SQL Editor do Supabase
-- para popular o banco com dados de teste
-- ================================================

-- Limpar dados existentes (CUIDADO: remove tudo!)
-- TRUNCATE TABLE products CASCADE;
-- TRUNCATE TABLE categories CASCADE;

-- ================================================
-- CATEGORIAS
-- ================================================

INSERT INTO categories (name, size_type, status) VALUES
  ('Sandálias Femininas', 'footwear', 'active'),
  ('Chinelos', 'footwear', 'active'),
  ('Rasteirinhas', 'footwear', 'active'),
  ('Tênis', 'footwear', 'active'),
  ('Bolsas', null, 'active'),
  ('Carteiras', null, 'active'),
  ('Acessórios', null, 'active'),
  ('Roupas Femininas', 'clothing', 'active');

-- ================================================
-- PRODUTOS - SANDÁLIAS
-- ================================================

INSERT INTO products (name, description, price, category_id, image_urls, available_sizes, status) VALUES
  (
    'Sandália Rakka Ultra Confort',
    'Sandália ultra confortável com palmilha anatômica e design moderno. Perfeita para o dia a dia com muito estilo e conforto.',
    149.90,
    1,
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
    ARRAY['34/35', '36', '37', '38', '39', '40'],
    'active'
  ),
  (
    'Sandália Elegance Premium',
    'Modelo elegante com acabamento premium e salto médio. Ideal para ocasiões especiais e eventos.',
    189.90,
    1,
    'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=400',
    ARRAY['36', '37', '38', '39', '40'],
    'active'
  ),
  (
    'Sandália Casual Verão',
    'Sandália leve e fresca, perfeita para dias quentes. Design casual com tiras ajustáveis.',
    129.90,
    1,
    'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=400',
    ARRAY['34/35', '36', '37', '38', '39', '40', '41'],
    'active'
  ),
  (
    'Sandália Tiras Cruzadas',
    'Modelo moderno com tiras cruzadas e fechamento ajustável. Versatilidade e conforto garantidos.',
    139.90,
    1,
    'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400',
    ARRAY['36', '37', '38', '39', '40'],
    'active'
  );

-- ================================================
-- PRODUTOS - CHINELOS
-- ================================================

INSERT INTO products (name, description, price, category_id, image_urls, available_sizes, status) VALUES
  (
    'Chinelo Slide Comfort',
    'Chinelo slide com palmilha macia e design minimalista. Ideal para casa e piscina.',
    59.90,
    2,
    'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400',
    ARRAY['36', '37', '38', '39', '40', '41', '42'],
    'active'
  ),
  (
    'Chinelo Havana Style',
    'Modelo inspirado nas praias de Havana. Leve, confortável e estiloso.',
    69.90,
    2,
    'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=400',
    ARRAY['34/35', '36', '37', '38', '39', '40'],
    'active'
  ),
  (
    'Chinelo Anatomic Pro',
    'Chinelo com tecnologia anatômica que se adapta ao formato do pé.',
    79.90,
    2,
    'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=400',
    ARRAY['36', '37', '38', '39', '40', '41', '42', '43'],
    'active'
  );

-- ================================================
-- PRODUTOS - RASTEIRINHAS
-- ================================================

INSERT INTO products (name, description, price, category_id, image_urls, available_sizes, status) VALUES
  (
    'Rasteirinha Bohemia',
    'Rasteirinha com detalhes em pedraria. Perfeita para um look boho chic.',
    89.90,
    3,
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
    ARRAY['34/35', '36', '37', '38', '39', '40'],
    'active'
  ),
  (
    'Rasteirinha Básica Essential',
    'Modelo básico e versátil que combina com tudo. Essencial no guarda-roupa.',
    69.90,
    3,
    'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=400',
    ARRAY['36', '37', '38', '39', '40'],
    'active'
  ),
  (
    'Rasteirinha Metalizada Glam',
    'Design metalizado que adiciona brilho ao visual. Moderna e fashion.',
    99.90,
    3,
    'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=400',
    ARRAY['36', '37', '38', '39', '40'],
    'active'
  );

-- ================================================
-- PRODUTOS - BOLSAS
-- ================================================

INSERT INTO products (name, description, price, category_id, image_urls, status) VALUES
  (
    'Bolsa Tote Grande',
    'Bolsa tote espaçosa ideal para o dia a dia. Múltiplos compartimentos internos.',
    199.90,
    5,
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    'active'
  ),
  (
    'Bolsa Tiracolo Elegance',
    'Bolsa tiracolo compacta e elegante. Alça ajustável em corrente.',
    169.90,
    5,
    'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400',
    'active'
  ),
  (
    'Bolsa Clutch Premium',
    'Clutch sofisticada para eventos. Acabamento em couro sintético premium.',
    139.90,
    5,
    'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400',
    'active'
  ),
  (
    'Bolsa Mochila Urban',
    'Mochila urbana estilosa e funcional. Ideal para o dia a dia.',
    189.90,
    5,
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    'active'
  );

-- ================================================
-- PRODUTOS - CARTEIRAS
-- ================================================

INSERT INTO products (name, description, price, category_id, image_urls, status) VALUES
  (
    'Carteira Slim Minimalista',
    'Carteira slim com design minimalista. Compacta e prática.',
    79.90,
    6,
    'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400',
    'active'
  ),
  (
    'Carteira Porta Tudo',
    'Modelo completo com múltiplos compartimentos para cartões e documentos.',
    89.90,
    6,
    'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400',
    'active'
  ),
  (
    'Carteira Zipper Premium',
    'Carteira com zíper e proteção RFID. Segurança e estilo.',
    99.90,
    6,
    'https://images.unsplash.com/photo-1608612522399-9b59a8580819?w=400',
    'active'
  );

-- ================================================
-- PRODUTOS - ACESSÓRIOS
-- ================================================

INSERT INTO products (name, description, price, category_id, image_urls, status) VALUES
  (
    'Cinto Fashion Premium',
    'Cinto em couro sintético com fivela moderna. Ajustável.',
    69.90,
    7,
    'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=400',
    'active'
  ),
  (
    'Conjunto de Pulseiras',
    'Kit com 3 pulseiras que podem ser usadas juntas ou separadas.',
    49.90,
    7,
    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400',
    'active'
  ),
  (
    'Óculos de Sol Aviator',
    'Óculos estilo aviador com proteção UV400. Clássico e atemporal.',
    129.90,
    7,
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
    'active'
  ),
  (
    'Lenço de Seda Estampado',
    'Lenço em seda sintética com estampa exclusiva. Versatilidade no visual.',
    59.90,
    7,
    'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400',
    'active'
  );

-- ================================================
-- PRODUTOS - ROUPAS
-- ================================================

INSERT INTO products (name, description, price, category_id, image_urls, available_sizes, status) VALUES
  (
    'Vestido Floral Verão',
    'Vestido leve e confortável com estampa floral. Perfeito para dias quentes.',
    159.90,
    8,
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
    ARRAY['P', 'M', 'G', 'GG'],
    'active'
  ),
  (
    'Blusa Cropped Básica',
    'Blusa cropped em malha de algodão. Essencial no guarda-roupa.',
    79.90,
    8,
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400',
    ARRAY['PP', 'P', 'M', 'G'],
    'active'
  ),
  (
    'Calça Jeans Skinny',
    'Calça jeans com modelagem skinny. Conforto e estilo.',
    189.90,
    8,
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400',
    ARRAY['36', '38', '40', '42', '44'],
    'active'
  ),
  (
    'Conjunto Moletom Comfort',
    'Conjunto de moletom super confortável. Ideal para dias frios.',
    229.90,
    8,
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
    ARRAY['P', 'M', 'G', 'GG'],
    'active'
  );

-- ================================================
-- VERIFICAÇÃO
-- ================================================

-- Contar produtos inseridos
SELECT
  c.name as categoria,
  COUNT(p.id) as total_produtos,
  SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) as ativos
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.name
ORDER BY total_produtos DESC;

-- Verificar produtos com tamanhos
SELECT
  name,
  category_id,
  available_sizes,
  price
FROM products
WHERE available_sizes IS NOT NULL
ORDER BY category_id;

-- Estatísticas gerais
SELECT
  COUNT(*) as total_produtos,
  SUM(price) as valor_total_inventario,
  AVG(price) as preco_medio,
  MIN(price) as menor_preco,
  MAX(price) as maior_preco
FROM products
WHERE status = 'active';
