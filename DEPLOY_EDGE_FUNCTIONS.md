# 🚀 Como Fazer Deploy das Edge Functions no Supabase

## Opção 1: Via Dashboard (MAIS FÁCIL - Recomendado)

### Passo 1: Acesse o Dashboard
```
https://supabase.com/dashboard/project/hnkhihzeqtzqzybkjype/functions
```

### Passo 2: Deploy de cada função

#### A) test-marketplace-connection (PRINCIPAL - corrige erro CORS)

1. No Dashboard, procure por `test-marketplace-connection`
   - Se existir: clique nela
   - Se não existir: clique em **"New Function"** e nomeie como `test-marketplace-connection`

2. Copie TODO o conteúdo do arquivo:
   ```
   supabase/functions/test-marketplace-connection/index.ts
   ```

3. Cole no editor do Supabase

4. Clique em **"Deploy"** ou **"Save"**

#### B) sync-to-marketplaces

1. Procure ou crie `sync-to-marketplaces`
2. Cole o conteúdo de: `supabase/functions/sync-to-marketplaces/index.ts`
3. Deploy

#### C) update-marketplace-stock

1. Procure ou crie `update-marketplace-stock`
2. Cole o conteúdo de: `supabase/functions/update-marketplace-stock/index.ts`
3. Deploy

---

## Opção 2: Via Supabase CLI (Avançado)

### Instalação do CLI

**Windows:**
```powershell
# Via npm
npm install -g supabase

# Ou via Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Linux:**
```bash
# Via npm
npm install -g supabase

# Ou baixar binário
curl -L https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/
```

### Fazer Login

```bash
# Login no Supabase
supabase login

# Vai abrir o navegador para autenticar
# Depois volta pro terminal
```

### Link com o Projeto

```bash
# Na pasta do projeto
cd /home/user/Codigin

# Linkar com o projeto do Supabase
supabase link --project-ref hnkhihzeqtzqzybkjype
```

### Deploy das Funções

```bash
# Deploy de uma função específica
supabase functions deploy test-marketplace-connection

# Deploy de todas as funções
supabase functions deploy
```

### Ver Logs

```bash
# Ver logs de uma função
supabase functions logs test-marketplace-connection

# Seguir logs em tempo real
supabase functions logs test-marketplace-connection --tail
```

---

## ✅ Como Verificar se Funcionou

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. **Recarregue a página** (Ctrl+F5)
3. **Teste a conexão** com WooCommerce novamente
4. **NÃO deve dar erro de CORS!**

---

## 🔍 Testar a Função Diretamente

Você pode testar a função direto via API:

```bash
curl -X POST \
  https://hnkhihzeqtzqzybkjype.supabase.co/functions/v1/test-marketplace-connection \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_SUPABASE_ANON_KEY" \
  -d '{
    "marketplace": "woocommerce",
    "credentials": {
      "store_url": "https://sua-loja.com",
      "client_id": "ck_xxxxx",
      "client_secret": "cs_xxxxx"
    }
  }'
```

Se retornar sem erro de CORS, funcionou! 🎉

---

## ⚠️ Importante

- Sempre faça deploy após modificar o código das funções
- O deploy via Dashboard sobrescreve a versão anterior
- Teste em ambiente de desenvolvimento antes de produção
- Guarde as credenciais do WooCommerce em local seguro
