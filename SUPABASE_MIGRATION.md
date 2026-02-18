# Geezer ERP — Documentação Supabase (Guia de Migração)

> Este documento registra **tudo** que precisa ser configurado no Supabase para que o sistema funcione. Use como guia ao migrar para um novo projeto/banco de dados.

---

## Sumário

1. [Criar Projeto Supabase](#1-criar-projeto-supabase)
2. [Variáveis de Ambiente](#2-variáveis-de-ambiente)
3. [Banco de Dados — Tabelas Originais](#3-banco-de-dados--tabelas-originais)
4. [Banco de Dados — Tabelas Novas (Migration 001)](#4-banco-de-dados--tabelas-novas-migration-001)
5. [Tabela de Credenciais WooCommerce](#5-tabela-de-credenciais-woocommerce)
6. [Storage Buckets](#6-storage-buckets)
7. [Edge Functions](#7-edge-functions)
8. [Authentication](#8-authentication)
9. [SQL Completo — Executar em Ordem](#9-sql-completo--executar-em-ordem)

---

## 1. Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project**
3. Escolha nome, senha do banco e região (preferencialmente `sa-east-1` para Brasil)
4. Aguarde o projeto ser criado (~2 minutos)
5. Vá em **Settings → API** e anote:
   - **Project URL** → usado como `VITE_SUPABASE_URL`
   - **anon public** key → usado como `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → usado nas Edge Functions (nunca no frontend!)

---

## 2. Variáveis de Ambiente

### No Easypanel (Frontend)

Configure em Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...sua-chave-anon...
VITE_WHATSAPP_NUMBER=5511999999999  (opcional)
```

### No Supabase (Edge Functions)

As Edge Functions recebem automaticamente do ambiente:
- `SUPABASE_URL` — URL do projeto
- `SUPABASE_SERVICE_ROLE_KEY` — chave de serviço

Não é necessário configurar manualmente.

---

## 3. Banco de Dados — Tabelas Originais

Estas tabelas devem existir antes de executar a Migration 001.

### `products`

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  status TEXT DEFAULT 'active',
  category_id INTEGER,
  image_urls TEXT[] DEFAULT '{}',
  weight NUMERIC(8,2),
  width NUMERIC(8,2),
  height NUMERIC(8,2),
  depth NUMERIC(8,2),
  woo_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `categories`

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `marketplace_sync_log`

```sql
CREATE TABLE marketplace_sync_log (
  id SERIAL PRIMARY KEY,
  marketplace TEXT NOT NULL,
  operation_type TEXT,
  local_product_id INTEGER,
  marketplace_product_id TEXT,
  status TEXT DEFAULT 'pending',
  http_status_code INTEGER,
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `banners`

```sql
CREATE TABLE banners (
  id SERIAL PRIMARY KEY,
  title TEXT,
  image_url TEXT,
  link TEXT,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Banco de Dados — Tabelas Novas (Migration 001)

Execute o arquivo `supabase/migrations/001_geezer_expansion.sql` no SQL Editor do Supabase.

### Alterações nas tabelas existentes

```sql
-- Adicionar colunas em categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS woo_id INTEGER;

-- Adicionar colunas em products
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS woo_tags INTEGER[];

-- Adicionar colunas em marketplace_sync_log
ALTER TABLE marketplace_sync_log ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE marketplace_sync_log ADD COLUMN IF NOT EXISTS entity_id TEXT;
```

### Nova tabela: `brands`

```sql
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  woo_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Nova tabela: `tags`

```sql
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  woo_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Nova tabela: `attributes`

```sql
CREATE TABLE IF NOT EXISTS attributes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  woo_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Nova tabela: `attribute_terms`

```sql
CREATE TABLE IF NOT EXISTS attribute_terms (
  id SERIAL PRIMARY KEY,
  attribute_id INTEGER REFERENCES attributes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  woo_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Nova tabela: `reviews` (somente leitura do WooCommerce)

```sql
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
```

### Nova tabela: `analytics_settings`

```sql
CREATE TABLE IF NOT EXISTS analytics_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  default_period INTEGER DEFAULT 30,
  revenue_goal NUMERIC(12,2) DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  sync_interval INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir linha padrão
INSERT INTO analytics_settings (id, default_period, revenue_goal, low_stock_threshold, sync_interval)
VALUES (1, 30, 0, 5, 10)
ON CONFLICT (id) DO NOTHING;
```

---

## 5. Tabela de Credenciais WooCommerce

Execute o arquivo `MARKETPLACE_CREDENTIALS_MIGRATION.sql` para criar/corrigir esta tabela.

```sql
CREATE TABLE IF NOT EXISTS marketplace_credentials (
  id SERIAL PRIMARY KEY,
  marketplace TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT false,

  -- Campos comuns
  client_id TEXT,
  client_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,

  -- WooCommerce
  store_url TEXT,
  consumer_key TEXT,
  consumer_secret TEXT,

  -- Configurações de sync
  auto_sync_stock BOOLEAN DEFAULT true,
  auto_sync_price BOOLEAN DEFAULT true,
  auto_sync_products BOOLEAN DEFAULT false,

  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_marketplace_credentials_marketplace
  ON marketplace_credentials(marketplace);
```

### Inserir credenciais WooCommerce iniciais

Após criar a tabela, insira uma linha inicial para o WooCommerce (valores serão preenchidos pela interface):

```sql
INSERT INTO marketplace_credentials (marketplace, is_active)
VALUES ('woocommerce', true)
ON CONFLICT (marketplace) DO NOTHING;
```

> **IMPORTANTE:** Caso o sistema retorne erro 400 no Analytics, execute:
> ```sql
> UPDATE marketplace_credentials SET is_active = true WHERE marketplace = 'woocommerce';
> ```

---

## 6. Storage Buckets

### Bucket: `product-images`

1. Acesse Supabase Dashboard → Storage → Buckets
2. Clique em **New bucket**
3. Nome: `product-images`
4. Marque **Public bucket** (necessário para as imagens serem acessíveis no WooCommerce)
5. Clique em **Save**

**Policy necessária (para upload autenticado):**

```sql
-- Permitir upload por usuários autenticados
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Permitir leitura pública
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Permitir delete por usuários autenticados
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
```

### Bucket: `Logos-site` (opcional)

Usado para hospedar o logo do sistema:

1. Crie bucket `Logos-site` como **Public**
2. Faça upload do arquivo `geezer_preto.png`
3. Atualize a URL nos arquivos:
   - `src/components/layout/AdminLayout.jsx` — constante `LOGO_URL`
   - `src/pages/Login.jsx` — atributo `src` da tag `<img>`

---

## 7. Edge Functions

### `woo-proxy`

**Localização:** `supabase/functions/woo-proxy/index.ts`

**Função:** Proxy seguro para a API REST do WooCommerce. Recebe requisições do frontend, busca as credenciais no banco, e faz a requisição ao WooCommerce servidor-a-servidor (evita CORS e não expõe credenciais no browser).

#### Deploy

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Linkar com o projeto
supabase link --project-ref SEU-PROJECT-REF

# Deploy da função
supabase functions deploy woo-proxy
```

#### Como usar (frontend)

```javascript
import { supabase } from '@/lib/supabase'

// Exemplo: buscar pedidos
const { data, error } = await supabase.functions.invoke('woo-proxy', {
  body: {
    method: 'GET',
    endpoint: 'orders?per_page=20'
  }
})
```

**Parâmetros do body:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `method` | string | Não (padrão: GET) | HTTP method: GET, POST, PUT, PATCH, DELETE |
| `endpoint` | string | Sim | Endpoint da API WooCommerce (sem `/wp-json/wc/v3/`) |
| `body` | object | Não | Payload para POST/PUT/PATCH |
| `credentials` | object | Não | Credenciais temporárias (para teste de conexão) |

---

## 8. Authentication

### Configurar usuário admin

1. Acesse Supabase Dashboard → Authentication → Users
2. Clique em **Add user** → **Create new user**
3. Insira e-mail e senha do administrador
4. Marque **Auto Confirm User**

### Configurar URL de redirect

1. Vá em Authentication → URL Configuration
2. **Site URL:** URL do seu sistema (ex: `https://erp.geezer.com.br`)
3. **Redirect URLs:** adicione a mesma URL

### RLS (Row Level Security)

Para produção, é recomendado habilitar RLS nas tabelas. Exemplo básico:

```sql
-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Política: apenas usuários autenticados têm acesso
CREATE POLICY "Authenticated access only" ON products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated access only" ON categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated access only" ON brands
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated access only" ON tags
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

> **Atenção:** Se habilitar RLS sem criar as policies, as tabelas ficam inacessíveis. Crie as policies antes ou logo após habilitar o RLS.

---

## 9. SQL Completo — Executar em Ordem

Execute os scripts abaixo **na ordem indicada** no SQL Editor do Supabase (Dashboard → SQL Editor → New query).

### Passo 1 — Tabelas base (se não existirem)

```sql
-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  status TEXT DEFAULT 'active',
  category_id INTEGER,
  image_urls TEXT[] DEFAULT '{}',
  weight NUMERIC(8,2),
  width NUMERIC(8,2),
  height NUMERIC(8,2),
  depth NUMERIC(8,2),
  woo_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync Log
CREATE TABLE IF NOT EXISTS marketplace_sync_log (
  id SERIAL PRIMARY KEY,
  marketplace TEXT NOT NULL,
  operation_type TEXT,
  local_product_id INTEGER,
  marketplace_product_id TEXT,
  status TEXT DEFAULT 'pending',
  http_status_code INTEGER,
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banners
CREATE TABLE IF NOT EXISTS banners (
  id SERIAL PRIMARY KEY,
  title TEXT,
  image_url TEXT,
  link TEXT,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Passo 2 — Executar Migration 001

```bash
# Via arquivo (recomendado)
# Copie o conteúdo de supabase/migrations/001_geezer_expansion.sql
# e cole no SQL Editor do Supabase
```

Ou execute o conteúdo completo do arquivo `supabase/migrations/001_geezer_expansion.sql`.

### Passo 3 — Credenciais WooCommerce

Copie e execute o conteúdo de `MARKETPLACE_CREDENTIALS_MIGRATION.sql`.

### Passo 4 — Inserir linha inicial WooCommerce

```sql
INSERT INTO marketplace_credentials (marketplace, is_active)
VALUES ('woocommerce', true)
ON CONFLICT (marketplace) DO NOTHING;
```

### Passo 5 — Criar Storage Bucket

Via interface do Supabase Dashboard → Storage → New bucket:
- Nome: `product-images`
- Tipo: Public

### Passo 6 — Deploy Edge Function

```bash
supabase link --project-ref SEU-PROJECT-REF
supabase functions deploy woo-proxy
```

### Passo 7 — Criar usuário admin

Via Supabase Dashboard → Authentication → Add user.

### Passo 8 — Configurar variáveis no Easypanel

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...sua-chave-anon...
```

---

## Índices de Performance

Já incluídos na Migration 001:

```sql
CREATE INDEX IF NOT EXISTS idx_brands_woo_id ON brands(woo_id);
CREATE INDEX IF NOT EXISTS idx_tags_woo_id ON tags(woo_id);
CREATE INDEX IF NOT EXISTS idx_attributes_woo_id ON attributes(woo_id);
CREATE INDEX IF NOT EXISTS idx_attribute_terms_attribute_id ON attribute_terms(attribute_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_woo_id ON reviews(woo_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_woo_id ON categories(woo_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_credentials_marketplace ON marketplace_credentials(marketplace);
```

---

*Documentação gerada para Geezer ERP — vend.ai & Grupo Venda © 2025*
