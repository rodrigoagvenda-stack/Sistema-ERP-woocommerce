import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface TestConnectionRequest {
  marketplace: string
  credentials: {
    client_id?: string
    client_secret?: string
    access_token?: string
    refresh_token?: string
    store_url?: string
    seller_id?: string
    shop_id?: string
    partner_id?: string
    partner_key?: string
  }
}

// Testar conexão com Mercado Livre
async function testMercadoLivre(credentials: any) {
  try {
    if (!credentials.access_token) {
      return { success: false, error: 'Access Token é obrigatório' }
    }

    // Testar autenticação buscando informações do usuário
    const response = await fetch('https://api.mercadolibre.com/users/me', {
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`
      }
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `HTTP ${response.status}: ${error}` }
    }

    const data = await response.json()
    return {
      success: true,
      message: `Conectado como: ${data.nickname} (ID: ${data.id})`,
      userData: {
        nickname: data.nickname,
        userId: data.id,
        siteId: data.site_id
      }
    }

  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Testar conexão com Shopee
async function testShopee(credentials: any) {
  try {
    if (!credentials.partner_id || !credentials.shop_id || !credentials.access_token) {
      return { success: false, error: 'Partner ID, Shop ID e Access Token são obrigatórios' }
    }

    // Testar autenticação buscando informações da loja
    const response = await fetch(
      `https://partner.shopeemobile.com/api/v2/shop/get_shop_info?partner_id=${credentials.partner_id}&shop_id=${credentials.shop_id}`,
      {
        headers: {
          'Authorization': credentials.access_token
        }
      }
    )

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `HTTP ${response.status}: ${error}` }
    }

    const data = await response.json()

    if (data.error) {
      return { success: false, error: data.message || 'Erro na API Shopee' }
    }

    return {
      success: true,
      message: `Conectado à loja: ${data.response?.shop_name || 'Loja Shopee'}`,
      userData: {
        shopName: data.response?.shop_name,
        shopId: credentials.shop_id
      }
    }

  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Testar conexão com TikTok Shop
async function testTikTokShop(credentials: any) {
  try {
    if (!credentials.app_key || !credentials.access_token || !credentials.shop_id) {
      return { success: false, error: 'App Key, Access Token e Shop ID são obrigatórios' }
    }

    // Testar autenticação buscando informações da loja
    const response = await fetch(
      `https://open-api.tiktokglobalshop.com/api/shop/get_authorized_shop?shop_id=${credentials.shop_id}`,
      {
        headers: {
          'x-tts-access-token': credentials.access_token,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `HTTP ${response.status}: ${error}` }
    }

    const data = await response.json()

    if (data.code !== 0) {
      return { success: false, error: data.message || 'Erro na API TikTok Shop' }
    }

    return {
      success: true,
      message: `Conectado à loja TikTok Shop (ID: ${credentials.shop_id})`,
      userData: {
        shopId: credentials.shop_id,
        region: data.data?.region || 'BR'
      }
    }

  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Testar conexão com Amazon SP-API
async function testAmazon(credentials: any) {
  try {
    if (!credentials.client_id || !credentials.client_secret || !credentials.refresh_token) {
      return { success: false, error: 'Client ID, Client Secret e Refresh Token são obrigatórios' }
    }

    // Amazon SP-API requer autenticação complexa com AWS Signature V4
    // Para um teste simples, podemos apenas validar se as credenciais estão no formato correto

    // Validação básica de formato
    if (credentials.client_id.length < 20 || credentials.client_secret.length < 20) {
      return { success: false, error: 'Credenciais parecem inválidas (muito curtas)' }
    }

    // Em produção, aqui você deveria:
    // 1. Gerar um token LWA usando refresh_token
    // 2. Fazer uma chamada simples à SP-API (ex: getMarketplaceParticipations)
    // 3. Validar a resposta

    return {
      success: true,
      message: '⚠️ Credenciais formatadas corretamente. Teste completo requer implementação adicional da SP-API.',
      userData: {
        clientId: credentials.client_id.substring(0, 10) + '...',
        note: 'Amazon SP-API requer assinatura AWS - implementação completa pendente'
      }
    }

  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Testar conexão com WooCommerce
async function testWooCommerce(credentials: any) {
  try {
    if (!credentials.store_url || !credentials.client_id || !credentials.client_secret) {
      return { success: false, error: 'URL da loja, Consumer Key e Consumer Secret são obrigatórios' }
    }

    // Validar URL
    let url = credentials.store_url.trim()
    if (!url.startsWith('http')) {
      url = 'https://' + url
    }

    const auth = btoa(`${credentials.client_id}:${credentials.client_secret}`)

    // Testar autenticação buscando informações do sistema
    const response = await fetch(`${url}/wp-json/wc/v3/system_status`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `HTTP ${response.status}: ${error}` }
    }

    const data = await response.json()

    return {
      success: true,
      message: `Conectado à loja: ${data.settings?.title?.value || 'WooCommerce'}`,
      userData: {
        storeUrl: url,
        wcVersion: data.environment?.version || 'desconhecida',
        wpVersion: data.environment?.wp_version || 'desconhecida'
      }
    }

  } catch (error) {
    return { success: false, error: error.message }
  }
}

serve(async (req) => {
  try {
    const { marketplace, credentials }: TestConnectionRequest = await req.json()

    if (!marketplace || !credentials) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Marketplace e credenciais são obrigatórios'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    let result
    switch (marketplace) {
      case 'mercado_livre':
        result = await testMercadoLivre(credentials)
        break
      case 'shopee':
        result = await testShopee(credentials)
        break
      case 'tiktok':
        result = await testTikTokShop(credentials)
        break
      case 'amazon':
        result = await testAmazon(credentials)
        break
      case 'woocommerce':
        result = await testWooCommerce(credentials)
        break
      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Marketplace não suportado'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
