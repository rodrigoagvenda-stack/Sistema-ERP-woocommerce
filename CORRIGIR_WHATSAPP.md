# 🔧 Como Corrigir o Número do WhatsApp

## Problema
O botão "Finalizar pelo WhatsApp" está usando o número errado: `+55 77 99983-8660`

## Número Correto
**+55 11 98675-1552** (formato: `5511986751552`)

---

## ✅ Solução Definitiva

### 1. Atualizar Variável de Ambiente no Servidor

#### Se estiver usando **Easypanel**:
1. Acesse o painel do Easypanel
2. Vá em **Settings** → **Environment Variables**
3. Encontre `VITE_WHATSAPP_NUMBER`
4. Altere o valor para: `5511986751552`
5. Clique em **Save**
6. **Restart** a aplicação

#### Se estiver usando **Docker**:
```bash
# Parar o container
docker stop <nome-container>

# Iniciar com variável correta
docker run -e VITE_WHATSAPP_NUMBER=5511986751552 ...

# Ou editar docker-compose.yml e adicionar:
environment:
  - VITE_WHATSAPP_NUMBER=5511986751552
```

#### Se estiver usando **Vercel/Netlify**:
1. Acesse o dashboard da plataforma
2. Vá em **Settings** → **Environment Variables**
3. Adicione ou edite: `VITE_WHATSAPP_NUMBER=5511986751552`
4. Faça redeploy da aplicação

---

### 2. Atualizar Banco de Dados (Supabase)

Execute o SQL no **Supabase SQL Editor**:

```sql
-- Adicionar colunas se não existirem
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '+5511986751552';

-- Atualizar o número
UPDATE settings
SET whatsapp_number = '+5511986751552',
    updated_at = NOW()
WHERE id = 1;

-- Verificar
SELECT whatsapp_number FROM settings WHERE id = 1;
```

---

### 3. Desenvolvimento Local

Copie `.env.example` para `.env`:
```bash
cp .env.example .env
```

Edite `.env` e certifique-se de que tem:
```
VITE_WHATSAPP_NUMBER=5511986751552
```

---

## 🧪 Como Testar

1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Recarregue a página (Ctrl+F5)
3. Adicione um produto ao carrinho
4. Clique em "Finalizar pelo WhatsApp"
5. Verifique se abre: `https://wa.me/5511986751552`

---

## 📝 Onde o Número é Usado

O número do WhatsApp vem de 3 lugares (em ordem de prioridade):

1. **Variável de ambiente** `VITE_WHATSAPP_NUMBER` (servidor)
2. **Banco de dados** tabela `settings`, coluna `whatsapp_number`
3. **Default no código** `src/config/env.js` linha 21

**O código já está correto!** O problema é sempre a variável de ambiente no servidor.

---

## ⚠️ IMPORTANTE

- Sempre use o formato **sem espaços e sem caracteres especiais**: `5511986751552`
- O código adiciona automaticamente o prefixo `https://wa.me/`
- Após alterar, sempre faça **restart** da aplicação
- Limpe o **cache do navegador** para ver as mudanças
