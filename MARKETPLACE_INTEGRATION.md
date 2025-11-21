# 🛍️ Integração Multi-Marketplace - Lucaya Griffe

Documentação completa da funcionalidade de integração com múltiplos marketplaces para sincronização automática de produtos, estoque e pedidos.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Como Usar](#como-usar)
- [Marketplaces Suportados](#marketplaces-suportados)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este sistema permite que você:

- ✅ Publique produtos automaticamente em 5 marketplaces diferentes
- ✅ Sincronize estoque em tempo real entre todos os canais
- ✅ Receba webhooks de pedidos e atualize estoque automaticamente
- ✅ Visualize logs detalhados de todas as sincronizações
- ✅ Configure credenciais de forma segura via interface

### Marketplaces Suportados:

1. **Mercado Livre** 🛒
2. **Shopee** 🛍️
3. **TikTok Shop** 🎵
4. **Amazon** 📦
5. **WooCommerce** 🌐

---

## 🏗️ Arquitetura

### Componentes:

```
┌─────────────────────────────────────────────────┐
│         Frontend (React)                        │
│  - MarketplaceSettings (Credenciais)            │
│  - ProductMarketplaces (Sincronização)          │
│  - MarketplaceSyncLogs (Logs)                   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│     Supabase (Backend)                          │
│  - PostgreSQL (Tabelas)                         │
│  - Edge Functions (APIs)                        │
│  - Row Level Security                           │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│   APIs dos Marketplaces                         │
│  - Mercado Livre API                            │
│  - Shopee Open Platform                         │
│  - TikTok Shop API                              │
│  - Amazon SP-API                                │
│  - WooCommerce REST API                         │
└─────────────────────────────────────────────────┘
```

### Fluxo de Dados:

1. **Cadastro de Produto** → Sistema Local
2. **Seleção de Marketplaces** → Usuário escolhe onde publicar
3. **Sincronização** → Edge Function envia para APIs dos marketplaces
4. **Mapeamento** → ID local ↔ ID do marketplace salvo
5. **Webhooks** → Marketplaces notificam vendas
6. **Atualização de Estoque** → Sincronização automática em todos canais

---

## 📦 Instalação

### 1. Executar Scripts SQL

Acesse o **Supabase SQL Editor** e execute:

```bash
# Arquivo com todas as tabelas necessárias
MARKETPLACE_TABLES.sql
```

Isso criará:
- `marketplace_credentials` - Credenciais dos marketplaces
- `marketplace_products` - Mapeamento produtos ↔ marketplaces
- `marketplace_sync_log` - Histórico de sincronizações
- `marketplace_stock_config` - Configurações de estoque

### 2. Deploy das Edge Functions

No terminal, dentro do projeto:

```bash
# Fazer deploy das Edge Functions no Supabase
supabase functions deploy sync-to-marketplaces
supabase functions deploy update-marketplace-stock
supabase functions deploy marketplace-webhook
```

### 3. Instalar Dependências (já incluídas)

Os componentes React já estão criados em `src/components/`:
- ✅ `MarketplaceSettings.jsx`
- ✅ `ProductMarketplaces.jsx`
- ✅ `MarketplaceSyncLogs.jsx`

---

## ⚙️ Configuração

### 1. Obter Credenciais dos Marketplaces

#### 🛒 Mercado Livre

1. Acesse: https://developers.mercadolivre.com.br/
2. Crie um aplicativo
3. Obtenha:
   - **App ID** (Client ID)
   - **Secret Key** (Client Secret)
4. Authorize o app e obtenha o **Access Token**

**Documentação:** https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao

---

#### 🛍️ Shopee

1. Acesse: https://open.shopee.com/
2. Registre-se como Partner
3. Crie um aplicativo
4. Obtenha:
   - **Partner ID**
   - **Partner Key**
   - **Shop ID**
5. Gere o **Access Token**

**Documentação:** https://open.shopee.com/documents/v2/v2.product.add_item

---

#### 🎵 TikTok Shop

1. Acesse: https://partner.tiktokshop.com/
2. Registre-se como Seller
3. Crie um aplicativo
4. Obtenha:
   - **App Key**
   - **App Secret**
   - **Shop ID**
5. Authorize e obtenha o **Access Token**

**Documentação:** https://partner.tiktokshop.com/docv2/page/6507ead7b99d5302be949ba9

---

#### 📦 Amazon

1. Acesse: https://sellercentral.amazon.com.br/apps/manage
2. Registre um Developer Account
3. Crie uma aplicação SP-API
4. Obtenha:
   - **LWA Client ID**
   - **LWA Client Secret**
   - **Seller ID**
   - **Refresh Token**

**Documentação:** https://developer-docs.amazon.com/sp-api/

⚠️ **Nota:** Amazon SP-API é a mais complexa e requer configuração adicional com assinatura de requisições.

---

#### 🌐 WooCommerce

1. No seu WordPress, vá em: **WooCommerce → Configurações → Avançado → API REST**
2. Clique em "Adicionar chave"
3. Configure:
   - **Descrição:** Integração Lucaya Griffe
   - **Usuário:** Admin
   - **Permissões:** Leitura/Gravação
4. Copie:
   - **Consumer Key**
   - **Consumer Secret**

**Documentação:** https://woocommerce.github.io/woocommerce-rest-api-docs/

---

### 2. Configurar no Sistema

#### Opção A: Via Interface (Recomendado)

1. Acesse o painel Admin
2. Vá em **Configurações → Integrações**
3. Para cada marketplace:
   - Ative o toggle
   - Preencha as credenciais
   - Configure sincronização automática
   - Clique em **Salvar**

#### Opção B: Via Banco de Dados

```sql
INSERT INTO marketplace_credentials (
  marketplace,
  is_active,
  client_id,
  client_secret,
  access_token
) VALUES (
  'mercado_livre',
  true,
  'SEU_APP_ID',
  'SEU_SECRET',
  'SEU_ACCESS_TOKEN'
);
```

---

## 🚀 Como Usar

### Publicar um Produto

1. **Cadastre o produto** normalmente no sistema
2. **Na seção "Integrações"** do formulário de produto:
   - Selecione os marketplaces onde deseja publicar
   - Clique em **"Publicar"**
3. **Aguarde a sincronização** (leva alguns segundos)
4. **Verifique o status:**
   - ✅ **Publicado** = Produto online no marketplace
   - ⚠️ **Pendente** = Aguardando processamento
   - ❌ **Erro** = Veja os logs para detalhes

### Sincronizar Estoque

O estoque é sincronizado **automaticamente** quando:
- Você atualiza o estoque no sistema
- Uma venda é registrada em qualquer marketplace (via webhook)

**Sincronização manual:**

```javascript
// Chamar Edge Function
const { data, error } = await supabase.functions.invoke('update-marketplace-stock', {
  body: {
    productId: 123,
    newStock: 50,
    marketplaces: ['mercado_livre', 'shopee'] // Opcional
  }
})
```

### Visualizar Logs

1. Acesse **Admin → Logs de Sincronização**
2. Filtros disponíveis:
   - Por marketplace
   - Por status (sucesso, erro, pendente)
   - Por data
3. Clique em qualquer log para ver detalhes completos

---

## 📡 API Reference

### Edge Functions

#### 1. sync-to-marketplaces

Sincroniza um produto com marketplaces selecionados.

**Endpoint:**
```
POST /functions/v1/sync-to-marketplaces
```

**Body:**
```json
{
  "productId": 123,
  "marketplaces": ["mercado_livre", "shopee"]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "marketplace": "mercado_livre",
      "success": true,
      "marketplaceId": "MLB123456789"
    },
    {
      "marketplace": "shopee",
      "success": true,
      "marketplaceId": "987654321"
    }
  ]
}
```

---

#### 2. update-marketplace-stock

Atualiza estoque em todos os marketplaces.

**Endpoint:**
```
POST /functions/v1/update-marketplace-stock
```

**Body:**
```json
{
  "productId": 123,
  "newStock": 50,
  "marketplaces": ["mercado_livre"] // Opcional
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "marketplace": "mercado_livre",
      "success": true,
      "stockSent": 50
    }
  ]
}
```

---

#### 3. marketplace-webhook

Recebe webhooks dos marketplaces.

**Endpoint:**
```
POST /functions/v1/marketplace-webhook?marketplace=mercado_livre
```

**Body:** Varia conforme marketplace

---

## 🔍 Troubleshooting

### Problema: "Erro ao sincronizar: 401 Unauthorized"

**Causa:** Token de acesso expirado

**Solução:**
1. Obtenha um novo Access Token no marketplace
2. Atualize em **Configurações → Integrações**

---

### Problema: "Produto não aparece no marketplace"

**Verificar:**
1. ✅ Credenciais estão ativas?
2. ✅ Produto tem todas informações obrigatórias? (nome, preço, estoque)
3. ✅ Categorias estão mapeadas?
4. ✅ Veja os logs de erro

---

### Problema: "Estoque não sincroniza"

**Verificar:**
1. ✅ "Sincronização automática de estoque" está ativada?
2. ✅ Produto foi publicado antes?
3. ✅ Webhooks estão configurados?

---

### Problema: "Amazon retorna erro"

**Solução:** Amazon SP-API é complexa e requer:
- Assinatura de requisições com AWS Signature V4
- Refresh token válido
- Configuração adicional de credenciais AWS

Recomendamos usar uma biblioteca especializada ou serviço intermediário.

---

## 🔐 Segurança

### Boas Práticas:

1. ✅ **Nunca** commite credenciais no Git
2. ✅ Credenciais gerenciadas via **interface admin** (não no .env)
3. ✅ Rotacione tokens regularmente
4. ✅ Configure **Row Level Security** no Supabase
5. ✅ Use **HTTPS** em produção
6. ✅ Monitore logs de acesso
7. ✅ **Teste conexões** antes de salvar
8. ✅ Implemente **criptografia em repouso** (ver abaixo)

### Gerenciamento de Credenciais:

As credenciais dos marketplaces são:
- ✅ Gerenciadas via **interface administrativa**
- ✅ Armazenadas no **banco de dados** (tabela `marketplace_credentials`)
- ✅ **Não** estão no código-fonte ou .env
- ✅ Acessíveis apenas via **API autenticada**
- ✅ Botão "Testar Conexão" valida credenciais antes de salvar

### Criptografia de Credenciais (Recomendado para Produção):

⚠️ As credenciais atualmente são armazenadas em texto plano no banco. Para produção, recomendamos:

**Opção 1: Criptografia no Supabase (Vault)**

```sql
-- Habilitar Supabase Vault
-- https://supabase.com/docs/guides/database/vault

-- Criar secrets
INSERT INTO vault.secrets (secret) VALUES ('seu_client_secret');

-- Atualizar tabela para usar secrets
ALTER TABLE marketplace_credentials
ADD COLUMN client_secret_id UUID REFERENCES vault.secrets(id);
```

**Opção 2: Criptografia com pgcrypto (PostgreSQL)**

```sql
-- Instalar extensão pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criptografar ao inserir
INSERT INTO marketplace_credentials (client_secret)
VALUES (pgp_sym_encrypt('secret_value', current_setting('app.encryption_key')));

-- Descriptografar ao ler (via Edge Function)
SELECT pgp_sym_decrypt(client_secret::bytea, current_setting('app.encryption_key'))
FROM marketplace_credentials;
```

### Permissões no Supabase:

```sql
-- Apenas admins autenticados podem gerenciar credenciais
CREATE POLICY "Admins podem gerenciar credenciais"
ON marketplace_credentials FOR ALL
USING (auth.role() = 'authenticated');

-- Adicionar verificação de admin role customizada
CREATE POLICY "Apenas admins podem ver credenciais"
ON marketplace_credentials FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 📊 Configurações Avançadas

### Buffer de Estoque

Configure um buffer para evitar overselling:

```sql
UPDATE marketplace_stock_config
SET stock_buffer = 5
WHERE marketplace = 'mercado_livre';
```

Exemplo: Se você tem 100 unidades, o sistema sincronizará 95 (100 - 5).

---

### Markup de Preço

Aplique markup diferente por marketplace:

```sql
UPDATE marketplace_stock_config
SET price_markup_percentage = 10.00
WHERE marketplace = 'shopee';
```

Preço local: R$ 100 → Shopee: R$ 110 (10% markup)

---

### Limite Máximo de Estoque

Limite a quantidade mostrada:

```sql
UPDATE marketplace_stock_config
SET max_quantity = 50
WHERE marketplace = 'amazon';
```

Mesmo que tenha 1000 unidades, Amazon mostrará apenas 50.

---

## 🎯 Próximos Passos

Após implementação básica, considere adicionar:

- [ ] Sincronização de imagens com otimização
- [ ] Mapeamento automático de categorias
- [ ] Gestão de variações de produtos (tamanhos, cores)
- [ ] Cálculo automático de frete
- [ ] Dashboard com métricas de vendas por canal
- [ ] Notificações push para erros
- [ ] Retry automático com backoff exponencial
- [ ] Sincronização de reviews/avaliações

---

## 📞 Suporte

Dúvidas sobre integrações específicas:

- **Mercado Livre:** https://developers.mercadolivre.com.br/support
- **Shopee:** https://open.shopee.com/documents
- **TikTok Shop:** https://partner.tiktokshop.com/support
- **Amazon:** https://developer-docs.amazon.com/sp-api/
- **WooCommerce:** https://woocommerce.com/document/woocommerce-rest-api/

---

## 📝 Changelog

### v1.0.0 (2025-01-21)
- ✅ Implementação inicial
- ✅ Suporte a 5 marketplaces
- ✅ Sincronização de produtos e estoque
- ✅ Sistema de logs completo
- ✅ Interface de configuração

---

**Desenvolvido com ❤️ para Lucaya Griffe**
