# 🚀 GUIA COMPLETO DE DEPLOY - LUKAYA GRIFFE

## 📦 **PASSO 1: ATUALIZAR O CÓDIGO**

### No seu servidor/local, execute:

```bash
# Ir para a pasta do projeto
cd /caminho/do/seu/projeto

# Buscar atualizações do GitHub
git fetch origin

# Mudar para a branch com as correções
git checkout claude/fix-product-upload-01JPRHeyiZr7bQbAQ6hZaUzk

# Baixar as alterações
git pull origin claude/fix-product-upload-01JPRHeyiZr7bQbAQ6hZaUzk
```

---

## 🗄️ **PASSO 2: ATUALIZAR O BANCO DE DADOS (SUPABASE)**

### 2.1 - Acesse o Supabase Dashboard:
```
https://supabase.com/dashboard
```

### 2.2 - Selecione seu projeto: `hnkhihzeqtzqzybkjype`

### 2.3 - Vá em **SQL Editor** (menu lateral esquerdo)

### 2.4 - Clique em **New Query**

### 2.5 - Cole o SQL abaixo e clique em **RUN**:

```sql
-- =====================================================
-- MIGRATION: Adicionar controle de estoque
-- =====================================================

-- Adicionar campos de estoque na tabela products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 5;

-- Atualizar produtos existentes com estoque padrão
UPDATE products
SET stock = 50, min_stock = 5
WHERE stock IS NULL;

-- Criar índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- =====================================================
-- VERIFICAR SE OS CAMPOS FORAM CRIADOS
-- =====================================================

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('stock', 'min_stock')
ORDER BY ordinal_position;
```

### 2.6 - Verifique se apareceu o resultado:
```
column_name  | data_type | column_default
-------------|-----------|---------------
stock        | integer   | 0
min_stock    | integer   | 5
```

✅ Se aparecer isso, deu certo!

---

## 📦 **PASSO 3: INSTALAR DEPENDÊNCIAS**

```bash
npm install
```

---

## 🏗️ **PASSO 4: BUILD DO PROJETO**

```bash
npm run build
```

---

## 🚀 **PASSO 5: FAZER DEPLOY**

### **Opção A - Easypanel/VPS:**

No Easypanel:
1. Vá no seu projeto
2. Clique em **Rebuild**
3. Aguarde o deploy finalizar

### **Opção B - Vercel:**

```bash
vercel --prod
```

### **Opção C - Docker:**

```bash
docker build -t lukaya-griffe .
docker stop lukaya-griffe-container || true
docker rm lukaya-griffe-container || true
docker run -d -p 3000:80 --name lukaya-griffe-container lukaya-griffe
```

---

## ✅ **PASSO 6: TESTAR SE FUNCIONOU**

Acesse seu site e teste:

1. ✅ **Galeria de Imagens**: Produto com carousel de fotos
2. ✅ **Estoque**: Admin > Produtos > tem campos de estoque
3. ✅ **Filtro de Tamanho**: Catálogo > filtro funciona
4. ✅ **Integrações**: Admin > Integrações > ícones coloridos
5. ✅ **WhatsApp**: Pedido usa número +5511986751552

---

## 📋 **RESUMO DAS MUDANÇAS**

### Arquivos NOVOS:
- `src/components/ProductGallery.jsx`
- `STOCK_MIGRATION.sql`
- `DEPLOY.md`

### Arquivos MODIFICADOS:
- `src/App.jsx`
- `src/components/MarketplaceSettings.jsx`
- `src/config/env.js`

---

## 🆘 **SE DER ERRO**

### Erro: "column stock does not exist"
Execute o SQL do PASSO 2 novamente no Supabase

### Erro: "Module not found: ProductGallery"
Execute: `git pull` e `npm install`

### Erro: Build falhou
Limpe o cache:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

**Branch:** `claude/fix-product-upload-01JPRHeyiZr7bQbAQ6hZaUzk`
**Commit:** `64f3984`
**GitHub:** https://github.com/Diguinsilva/Codigin
