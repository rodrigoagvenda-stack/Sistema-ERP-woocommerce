# 📚 Documentação Real das APIs de Marketplace

## ⚠️ INFORMAÇÕES CRÍTICAS SOBRE TOKENS

### Token Expiration Summary
| Marketplace | Access Token | Refresh Token | Notas Importantes |
|------------|--------------|---------------|-------------------|
| **WooCommerce** | Nunca expira | N/A | Consumer Key/Secret permanentes |
| **Mercado Livre** | **6 horas** | **6 meses** (single-use) | Invalida se sem uso por 4 meses |
| **Shopee** | **4 horas** | **1 mês** | Precisa refresh periódico |
| **TikTok Shop** | **24 horas** | **Não especificado** | Verificar docs |
| **Amazon** | **1 hora** | **Não expira** | Requer AWS Signature V4 |

---

## 1. WooCommerce

### Autenticação
- **Método:** HTTP Basic Authentication
- **Username:** Consumer Key (ck_xxxxx)
- **Password:** Consumer Secret (cs_xxxxx)

### Como Gerar Credenciais
1. WooCommerce → Settings → Advanced → REST API
2. Add Key
3. Description: "Lukaya Griffe Integration"
4. Permissions: Read/Write
5. Generate API Key

### ⚠️ WooCommerce 9.0+ - Plugin Legacy REST API
A partir do **WooCommerce 9.0** (lançado em 2024), a Legacy REST API foi **removida do núcleo**.

**Solução:**
- Instalar o plugin **"WooCommerce Legacy REST API"**
- Disponível em: https://wordpress.org/plugins/woocommerce-legacy-rest-api/
- Mais de 400.000 instalações ativas
- Última atualização: 23 de janeiro de 2025
- É instalado automaticamente em upgrades do WooCommerce 8.8+

**Importante:**
- O plugin restaura a funcionalidade completa da API REST removida
- Chaves existentes continuam funcionando
- WooCommerce não planeja suportar indefinidamente - recomenda migrar para API v3
- Não compatível com High-Performance Order Storage (HPOS)

### Endpoint de Teste
```
GET /wp-json/wc/v3/system_status
Authorization: Basic base64(consumer_key:consumer_secret)
```

### Exemplo de Autenticação
```javascript
const auth = btoa(`${consumer_key}:${consumer_secret}`)
fetch(`${store_url}/wp-json/wc/v3/system_status`, {
  headers: {
    'Authorization': `Basic ${auth}`
  }
})
```

✅ **Status:** Implementação atual está correta! Usa API REST v3 (versão atual e suportada)

---

## 2. Mercado Livre

### Fluxo OAuth 2.0
1. **Authorization Code** → obtém código
2. **Access Token** → troca código por tokens
3. **Refresh Token** → renova access token (SINGLE-USE!)

### ⚠️ CRÍTICO: Refresh Token
- **Single-use**: Cada refresh gera NOVO refresh_token
- **Validade**: 6 meses
- **Inatividade**: 4 meses sem request = tokens invalidados
- **Apenas último refresh_token é válido**

### Endpoints
```
# Testar conexão
GET https://api.mercadolibre.com/users/me
Authorization: Bearer {access_token}

# Refresh token
POST https://api.mercadolibre.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&client_id={APP_ID}
&client_secret={SECRET_KEY}
&refresh_token={REFRESH_TOKEN}
```

### Resposta Refresh
```json
{
  "access_token": "APP_USR-novo-token",
  "token_type": "Bearer",
  "expires_in": 21600,  // 6 horas em segundos
  "scope": "offline_access read write",
  "user_id": 12345,
  "refresh_token": "TG-novo-refresh-token"  // ⚠️ SALVAR ESTE NOVO!
}
```

⚠️ **Status:** Precisa implementar refresh automático quando access_token expirar!

### Sistema de Refresh Recomendado
```javascript
// Verificar expiração antes de cada request
if (Date.now() >= token_expires_at) {
  await refreshMercadoLivreToken()
}
```

---

## 3. Shopee

### Autenticação v2
Shopee usa **assinatura SHA256** para todas as requisições.

### Gerar Signature
```javascript
// Para endpoints públicos (get token)
const baseString = partner_id + path + timestamp
const signature = crypto.createHmac('sha256', partner_key)
  .update(baseString)
  .digest('hex')

// Para endpoints autenticados
const baseString = partner_id + path + timestamp + access_token + shop_id
const signature = crypto.createHmac('sha256', partner_key)
  .update(baseString)
  .digest('hex')
```

### Fluxo de Autenticação
1. **Auth Partner** → Gera link de autorização (válido 5 min)
2. **Get Access Token** → Troca code por tokens
3. **Refresh Access Token** → Renova quando expirar (4h)

### Endpoints
```
# 1. Autorização (válido 5 minutos!)
GET https://partner.shopeemobile.com/api/v2/shop/auth_partner
?partner_id={PARTNER_ID}
&redirect={YOUR_REDIRECT_URL}
&sign={SIGNATURE}
&timestamp={UNIX_TIMESTAMP}

# 2. Get Access Token
POST https://partner.shopeemobile.com/api/v2/auth/token/get
{
  "code": "{AUTH_CODE}",
  "shop_id": {SHOP_ID},
  "partner_id": {PARTNER_ID}
}

# 3. Refresh Token
POST https://partner.shopeemobile.com/api/v2/auth/access_token/get
{
  "refresh_token": "{REFRESH_TOKEN}",
  "shop_id": {SHOP_ID},
  "partner_id": {PARTNER_ID}
}
```

⚠️ **Status:** Implementação atual INCOMPLETA - não calcula signature corretamente!

---

## 4. TikTok Shop

### Autenticação
- Usa **OAuth 2.0** com App Key e App Secret
- Access token expira em **24 horas**
- Refresh periódico necessário

### Endpoints
```
GET https://open-api.tiktokglobalshop.com/api/shop/get_authorized_shop
Headers:
  x-tts-access-token: {ACCESS_TOKEN}
  Content-Type: application/json
```

⚠️ **Status:** Verificar documentação oficial para detalhes completos

---

## 5. Amazon SP-API

### Autenticação Complexa
- Requer **AWS Signature Version 4**
- Access token LWA expira em **1 hora**
- Refresh token **não expira** (até ser revogado)

### Fluxo
1. Obter LWA Access Token com refresh_token
2. Assinar request com AWS Signature V4
3. Fazer request à SP-API

⚠️ **Status:** Requer implementação complexa - recomendo biblioteca dedicada

---

## 🔧 Sistema de Refresh Automático Recomendado

### Tabela marketplace_credentials - Adicionar:
```sql
ALTER TABLE marketplace_credentials
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;
```

### Implementar Função de Refresh
```javascript
async function ensureValidToken(marketplace, credentials) {
  // Verificar se token vai expirar em menos de 5 minutos
  const expiresIn5Min = new Date(Date.now() + 5 * 60 * 1000)

  if (credentials.token_expires_at && new Date(credentials.token_expires_at) < expiresIn5Min) {
    // Refresh token
    switch(marketplace) {
      case 'mercado_livre':
        return await refreshMercadoLivreToken(credentials)
      case 'shopee':
        return await refreshShopeeToken(credentials)
      case 'tiktok':
        return await refreshTikTokToken(credentials)
      // ...
    }
  }

  return credentials
}
```

---

## 📖 Fontes

### WooCommerce
- [WooCommerce REST API Documentation](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [WooCommerce Developer Docs](https://developer.woocommerce.com/docs/apis/rest-api/)
- [How to Find WooCommerce Consumer Key](https://woolentor.com/doc/how-to-find-woocommerce-consumer-key/)

### Mercado Livre
- [Authentication and Authorization](https://developers.mercadolivre.com.br/en_us/authentication-and-authorization)
- [Authorization Best Practices](https://global-selling.mercadolibre.com/devsite/authorization-and-token-best-practices)
- [Mercado Libre API Integration Guide](https://rollout.com/integration-guides/mercado-libre/how-to-build-a-public-mercado-libre-integration-building-the-auth-flow)

### Shopee
- [Shopee OpenAPI Handsup](https://wendeehsu.medium.com/shopee-openapi-handsup-e0daca280f75)
- [Shopee API Essentials](https://rollout.com/integration-guides/shopee/api-essentials)
- [Guidelines for Creating Sign](https://automationnocode.com/guidelines-for-creating-sign-and-retrieving-access-token-for-shopee-api/)

---

## ⚠️ PRÓXIMOS PASSOS CRÍTICOS

1. ✅ **WooCommerce** - Já funciona corretamente
2. 🔴 **Mercado Livre** - Implementar refresh automático URGENTE
3. 🔴 **Shopee** - Corrigir cálculo de signature
4. 🟡 **TikTok** - Verificar documentação completa
5. 🟡 **Amazon** - Implementação complexa - avaliar biblioteca
