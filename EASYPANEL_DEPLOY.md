# 🚀 DEPLOY NO EASYPANEL - LUKAYA GRIFFE

## 📋 **PASSO 1: ACESSAR O EASYPANEL**

1. Entre no Easypanel: https://easypanel.io
2. Faça login
3. Selecione seu projeto **Lukaya Griffe**

---

## 🔄 **PASSO 2: ATUALIZAR O REPOSITÓRIO NO EASYPANEL**

### Opção A - Via Interface do Easypanel (MAIS FÁCIL):

1. Vá em **Settings** do seu projeto
2. Procure por **Source** ou **Git**
3. Clique em **Deploy** ou **Redeploy**
4. Selecione a branch: `claude/fix-product-upload-01JPRHeyiZr7bQbAQ6hZaUzk`
5. Clique em **Deploy**

### Opção B - Via SSH (se a Opção A não funcionar):

1. No Easypanel, vá em **Terminal** ou **Console**
2. Execute estes comandos:

```bash
# Ir para a pasta do projeto
cd /app

# Buscar atualizações
git fetch origin

# Mudar para a branch com correções
git checkout claude/fix-product-upload-01JPRHeyiZr7bQbAQ6hZaUzk

# Baixar alterações
git pull origin claude/fix-product-upload-01JPRHeyiZr7bQbAQ6hZaUzk

# Instalar dependências
npm install

# Build
npm run build
```

3. Depois, no Easypanel, clique em **Restart** ou **Rebuild**

---

## 🗄️ **PASSO 3: ATUALIZAR O BANCO DE DADOS (SUPABASE)**

**IMPORTANTE**: Você precisa executar o SQL no Supabase, não no Easypanel!

1. Abra em outra aba: https://supabase.com/dashboard
2. Selecione seu projeto: `hnkhihzeqtzqzybkjype`
3. Menu lateral: **SQL Editor**
4. Clique em **New Query**
5. Cole este SQL:

```sql
-- Adicionar campos de estoque
ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 5;

-- Atualizar produtos existentes
UPDATE products
SET stock = 50, min_stock = 5
WHERE stock IS NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
```

6. Clique em **RUN** (botão verde no canto inferior direito)
7. Verifique se apareceu "Success" ou "Rows affected"

✅ Se deu certo, você verá uma mensagem de sucesso!

---

## 🔍 **PASSO 4: VERIFICAR SE ATUALIZOU**

1. No Easypanel, vá em **Logs** do seu projeto
2. Procure por estas mensagens:
   - `✅ Supabase conectado com sucesso!`
   - Build bem-sucedido

3. Acesse seu site e teste:
   - **Admin** → **Produtos** → **Novo Produto**
   - Deve aparecer os campos **Estoque Atual** e **Estoque Mínimo**

---

## ⚠️ **SE NÃO APARECER AS MUDANÇAS**

### Problema 1: Branch errada
**Solução**:
1. No Easypanel → Settings → Source
2. Verifique se está usando a branch: `claude/fix-product-upload-01JPRHeyiZr7bQbAQ6hZaUzk`
3. Se não estiver, mude e faça Redeploy

### Problema 2: Cache do build
**Solução**:
1. No Easypanel, vá em Settings
2. Procure por **Build Cache** ou similar
3. Clique em **Clear Cache**
4. Faça **Rebuild** do projeto

### Problema 3: Código não atualizou
**Solução via SSH**:
```bash
cd /app
rm -rf node_modules package-lock.json
git fetch --all
git reset --hard origin/claude/fix-product-upload-01JPRHeyiZr7bQbAQ6hZaUzk
npm install
npm run build
```

Depois: Restart no Easypanel

---

## 📸 **O QUE VOCÊ VAI VER DEPOIS DO DEPLOY**

### ✅ No Admin:
- **Produtos** → Campos de Estoque (Estoque Atual + Estoque Mínimo)
- **Integrações** → Ícones coloridos (não emojis)

### ✅ No Catálogo:
- Produtos com múltiplas fotos
- Carousel de imagens
- Filtro de tamanho funcionando

### ✅ Nos Pedidos:
- WhatsApp usando: +5511986751552

---

## 🆘 **AINDA NÃO FUNCIONA?**

Me manda:
1. Print dos **Logs** do Easypanel
2. Print da **Source/Git** mostrando qual branch está
3. Print do **Supabase SQL Editor** mostrando se o SQL executou

**Branch correta**: `claude/fix-product-upload-01JPRHeyiZr7bQbAQ6hZaUzk`
**Commit**: `c1c1fbf` (mais recente com DEPLOY.md)
**GitHub**: https://github.com/Diguinsilva/Codigin
