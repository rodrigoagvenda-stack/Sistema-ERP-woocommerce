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
    consumer_key?: string
    consumer_secret?: string
    app_key?: string
    app_secret?: string
  }
}

// Testar conexão com Mercado Livre
async function testMercadoLivre(credentials: any) {
  try {
    console.log('🔍 Mercado Livre - client_id:', credentials.client_id ? 'presente' : 'ausente')
    console.log('🔍 Mercado Livre - client_secret:', credentials.client_secret ? 'presente' : 'ausente')
    console.log('🔍 Mercado Livre - refresh_token:', credentials.refresh_token ? 'presente' : 'ausente')

    // Se tiver refresh_token, tentar obter access_token novo
    if (credentials.refresh_token && credentials.client_id && credentials.client_secret) {
      console.log('🔄 Mercado Livre - Tentando refresh do access_token')

      const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: credentials.client_id,
          client_secret: credentials.client_secret,
          refresh_token: credentials.refresh_token
        })
      })

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text()
        console.error('❌ Mercado Livre - Erro no refresh:', error)
        return {
          success: false,
          error: `Erro ao renovar token: HTTP ${tokenResponse.status}`,
          debug: { error }
        }
      }

      const tokenData = await tokenResponse.json()
      console.log('✅ Mercado Livre - Token renovado com sucesso!')
      console.log('🔍 Mercado Livre - Novo access_token válido por:', tokenData.expires_in, 'segundos')

      credentials.access_token = tokenData.access_token
      // IMPORTANTE: O novo refresh_token deve ser salvo no banco!
      if (tokenData.refresh_token) {
        console.log('⚠️  Mercado Livre - NOVO refresh_token recebido! Deve ser salvo no banco.')
      }
    }

    if (!credentials.access_token) {
      return {
        success: false,
        error: 'Access Token ou Refresh Token são obrigatórios',
        debug: {
          client_id: credentials.client_id ? 'presente' : 'AUSENTE',
          client_secret: credentials.client_secret ? 'presente' : 'AUSENTE',
          refresh_token: credentials.refresh_token ? 'presente' : 'AUSENTE',
          received_keys: Object.keys(credentials)
        }
      }
    }

    console.log('🔍 Mercado Livre - Testando autenticação com /users/me')

    // Testar autenticação buscando informações do usuário
    const response = await fetch('https://api.mercadolibre.com/users/me', {
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`
      }
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Mercado Livre - Erro na autenticação:', error)
      return {
        success: false,
        error: `HTTP ${response.status}: ${error}`,
        debug: { status: response.status, error }
      }
    }

    const data = await response.json()
    console.log('✅ Mercado Livre - Conectado:', data.nickname, '(ID:', data.id, ')')

    return {
      success: true,
      message: `Conectado como: ${data.nickname} (ID: ${data.id})`,
      userData: {
        nickname: data.nickname,
        userId: data.id,
        siteId: data.site_id,
        email: data.email
      }
    }

  } catch (error) {
    console.error('❌ Mercado Livre - Erro:', error)
    return { success: false, error: error.message }
  }
}

// Testar conexão com Shopee
async function testShopee(credentials: any) {
  try {
    console.log('🔍 Shopee - partner_id:', credentials.partner_id ? 'presente' : 'ausente')
    console.log('🔍 Shopee - partner_key:', credentials.partner_key ? 'presente' : 'ausente')
    console.log('🔍 Shopee - shop_id:', credentials.shop_id ? 'presente' : 'ausente')
    console.log('🔍 Shopee - access_token:', credentials.access_token ? 'presente' : 'ausente')

    if (!credentials.partner_id || !credentials.partner_key || !credentials.shop_id) {
      return {
        success: false,
        error: 'Partner ID, Partner Key e Shop ID são obrigatórios',
        debug: {
          partner_id: credentials.partner_id ? 'presente' : 'AUSENTE',
          partner_key: credentials.partner_key ? 'presente' : 'AUSENTE',
          shop_id: credentials.shop_id ? 'presente' : 'AUSENTE',
          received_keys: Object.keys(credentials)
        }
      }
    }

    // Gerar signature SHA256 (Shopee API v2 requer isso)
    const timestamp = Math.floor(Date.now() / 1000)
    const path = '/api/v2/shop/get_shop_info'
    const baseString = `${credentials.partner_id}${path}${timestamp}`

    console.log('🔍 Shopee - Gerando signature SHA256')
    console.log('🔍 Shopee - Timestamp:', timestamp)
    console.log('🔍 Shopee - Base string:', baseString)

    // Criar signature usando SHA256
    const encoder = new TextEncoder()
    const keyData = encoder.encode(credentials.partner_key)
    const messageData = encoder.encode(baseString)

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    console.log('✅ Shopee - Signature gerada:', signatureHex.substring(0, 20) + '...')

    // Construir URL com parâmetros
    const url = new URL('https://partner.shopeemobile.com/api/v2/shop/get_shop_info')
    url.searchParams.append('partner_id', credentials.partner_id.toString())
    url.searchParams.append('timestamp', timestamp.toString())
    url.searchParams.append('sign', signatureHex)
    url.searchParams.append('shop_id', credentials.shop_id.toString())

    if (credentials.access_token) {
      url.searchParams.append('access_token', credentials.access_token)
    }

    console.log('🔍 Shopee - Chamando API:', url.pathname)

    // Testar autenticação buscando informações da loja
    const response = await fetch(url.toString())

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Shopee - Erro HTTP:', response.status, error)
      return {
        success: false,
        error: `HTTP ${response.status}: ${error}`,
        debug: { status: response.status, error }
      }
    }

    const data = await response.json()
    console.log('🔍 Shopee - Resposta:', JSON.stringify(data).substring(0, 100) + '...')

    if (data.error) {
      console.error('❌ Shopee - Erro da API:', data.message || data.error)
      return {
        success: false,
        error: data.message || `Erro ${data.error} na API Shopee`,
        debug: { error: data.error, message: data.message }
      }
    }

    console.log('✅ Shopee - Conectado:', data.response?.shop_name || 'Loja Shopee')

    return {
      success: true,
      message: `Conectado à loja: ${data.response?.shop_name || 'Loja Shopee'}`,
      userData: {
        shopName: data.response?.shop_name,
        shopId: credentials.shop_id,
        region: data.response?.region || 'BR'
      }
    }

  } catch (error) {
    console.error('❌ Shopee - Erro:', error)
    return { success: false, error: error.message }
  }
}

// Testar conexão com TikTok Shop
async function testTikTokShop(credentials: any) {
  try {
    console.log('🔍 TikTok Shop - app_key:', credentials.app_key ? 'presente' : 'ausente')
    console.log('🔍 TikTok Shop - app_secret:', credentials.app_secret ? 'presente' : 'ausente')
    console.log('🔍 TikTok Shop - shop_id:', credentials.shop_id ? 'presente' : 'ausente')
    console.log('🔍 TikTok Shop - access_token:', credentials.access_token ? 'presente' : 'ausente')

    if (!credentials.app_key || !credentials.shop_id) {
      return {
        success: false,
        error: 'App Key e Shop ID são obrigatórios',
        debug: {
          app_key: credentials.app_key ? 'presente' : 'AUSENTE',
          app_secret: credentials.app_secret ? 'presente' : 'AUSENTE',
          shop_id: credentials.shop_id ? 'presente' : 'AUSENTE',
          access_token: credentials.access_token ? 'presente' : 'AUSENTE',
          received_keys: Object.keys(credentials)
        }
      }
    }

    if (!credentials.access_token) {
      console.error('❌ TikTok Shop - Access Token ausente')
      return {
        success: false,
        error: 'Access Token é obrigatório. Gere um token através do fluxo OAuth do TikTok.',
        debug: { access_token: 'AUSENTE' }
      }
    }

    console.log('🔍 TikTok Shop - Chamando API /api/shop/get_authorized_shop')

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
      console.error('❌ TikTok Shop - Erro HTTP:', response.status, error)
      return {
        success: false,
        error: `HTTP ${response.status}: ${error}`,
        debug: { status: response.status, error }
      }
    }

    const data = await response.json()
    console.log('🔍 TikTok Shop - Resposta:', JSON.stringify(data).substring(0, 100) + '...')

    if (data.code !== 0) {
      console.error('❌ TikTok Shop - Erro da API:', data.message || data.code)
      return {
        success: false,
        error: data.message || `Erro ${data.code} na API TikTok Shop`,
        debug: { code: data.code, message: data.message }
      }
    }

    console.log('✅ TikTok Shop - Conectado! Shop ID:', credentials.shop_id)

    return {
      success: true,
      message: `Conectado à loja TikTok Shop (ID: ${credentials.shop_id})`,
      userData: {
        shopId: credentials.shop_id,
        shopName: data.data?.shop_name || 'TikTok Shop',
        region: data.data?.region || 'BR'
      }
    }

  } catch (error) {
    console.error('❌ TikTok Shop - Erro:', error)
    return { success: false, error: error.message }
  }
}

// Testar conexão com Amazon SP-API
async function testAmazon(credentials: any) {
  try {
    console.log('🔍 Amazon SP-API - client_id:', credentials.client_id ? 'presente' : 'ausente')
    console.log('🔍 Amazon SP-API - client_secret:', credentials.client_secret ? 'presente' : 'ausente')
    console.log('🔍 Amazon SP-API - refresh_token:', credentials.refresh_token ? 'presente' : 'ausente')
    console.log('🔍 Amazon SP-API - seller_id:', credentials.seller_id ? 'presente' : 'ausente')

    if (!credentials.client_id || !credentials.client_secret || !credentials.refresh_token) {
      return {
        success: false,
        error: 'Client ID, Client Secret e Refresh Token são obrigatórios',
        debug: {
          client_id: credentials.client_id ? 'presente' : 'AUSENTE',
          client_secret: credentials.client_secret ? 'presente' : 'AUSENTE',
          refresh_token: credentials.refresh_token ? 'presente' : 'AUSENTE',
          received_keys: Object.keys(credentials)
        }
      }
    }

    console.log('🔍 Amazon SP-API - Tentando obter LWA access token')

    // Tentar obter access token via Login with Amazon (LWA)
    const tokenResponse = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: credentials.refresh_token,
        client_id: credentials.client_id,
        client_secret: credentials.client_secret
      })
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('❌ Amazon SP-API - Erro ao obter token LWA:', error)
      return {
        success: false,
        error: `Erro ao autenticar com LWA: HTTP ${tokenResponse.status}`,
        debug: { status: tokenResponse.status, error }
      }
    }

    const tokenData = await tokenResponse.json()
    console.log('✅ Amazon SP-API - Access token obtido com sucesso!')
    console.log('🔍 Amazon SP-API - Token expira em:', tokenData.expires_in, 'segundos')

    // NOTA: Para fazer chamadas à SP-API, seria necessário:
    // 1. Implementar AWS Signature Version 4
    // 2. Determinar o marketplace (região)
    // 3. Fazer chamada a um endpoint simples (ex: /sellers/v1/marketplaceParticipations)
    //
    // Isso é muito complexo e requer biblioteca específica ou implementação extensa.
    // Por ora, validamos apenas a autenticação LWA.

    console.log('⚠️  Amazon SP-API - Autenticação LWA OK, mas chamadas à SP-API requerem AWS Signature V4')

    return {
      success: true,
      message: '✅ Autenticação LWA bem-sucedida! ⚠️ Chamadas à SP-API requerem implementação de AWS Signature V4.',
      userData: {
        clientId: credentials.client_id.substring(0, 15) + '...',
        tokenType: tokenData.token_type || 'bearer',
        expiresIn: tokenData.expires_in + 's',
        note: 'Amazon SP-API requer AWS Signature V4 - recomendado usar biblioteca @sp-api-sdk'
      }
    }

  } catch (error) {
    console.error('❌ Amazon SP-API - Erro:', error)
    return { success: false, error: error.message }
  }
}

// Testar conexão com WooCommerce
async function testWooCommerce(credentials: any) {
  try {
    console.log('🔍 WooCommerce - store_url:', credentials.store_url)
    console.log('🔍 WooCommerce - consumer_key:', credentials.consumer_key ? 'presente' : 'ausente')
    console.log('🔍 WooCommerce - consumer_secret:', credentials.consumer_secret ? 'presente' : 'ausente')

    if (!credentials.store_url || !credentials.consumer_key || !credentials.consumer_secret) {
      return {
        success: false,
        error: `URL da loja, Consumer Key e Consumer Secret são obrigatórios`,
        debug: {
          store_url: credentials.store_url || 'AUSENTE',
          consumer_key: credentials.consumer_key ? 'presente' : 'AUSENTE',
          consumer_secret: credentials.consumer_secret ? 'presente' : 'AUSENTE',
          received_keys: Object.keys(credentials)
        }
      }
    }

    // Validar URL
    let url = credentials.store_url.trim()
    if (!url.startsWith('http')) {
      url = 'https://' + url
    }

    const auth = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`)

    // ETAPA 1: Verificar se WordPress REST API está funcionando
    console.log('🔍 WooCommerce - Testando WordPress REST API:', `${url}/wp-json/`)
    const wpRestResponse = await fetch(`${url}/wp-json/`, {
      method: 'GET'
    })

    console.log('🔍 WooCommerce - WordPress REST API status:', wpRestResponse.status)

    if (!wpRestResponse.ok) {
      const errorText = await wpRestResponse.text()
      console.error('❌ WooCommerce - WordPress REST API não acessível:', errorText.substring(0, 200))

      // Verificar se é um problema de permalinks
      if (wpRestResponse.status === 404 || errorText.includes('<!doctype') || errorText.includes('<html')) {
        return {
          success: false,
          error: `❌ API REST do WooCommerce não está acessível.

📋 INSTRUÇÕES PARA CORRIGIR:

1️⃣ **PERMALINKS (Causa mais comum)**
   • Acesse: WordPress Admin → Configurações → Links Permanentes
   • Escolha QUALQUER opção EXCETO "Simples"
   • Recomendado: "Nome do post" ou "Dia e nome"
   • Clique em "Salvar alterações"

2️⃣ **VERIFICAR WOOCOMMERCE**
   • Acesse: WordPress Admin → Plugins
   • Confirme que WooCommerce está instalado e ativo

3️⃣ **API REST DO WOOCOMMERCE**
   • Acesse: WooCommerce → Configurações → Avançado → REST API
   • Verifique se há chaves API criadas
   • Consumer Key e Secret devem estar corretos

4️⃣ **URL DA LOJA**
   • URL testada: ${url}
   • Deve ser a raiz do WordPress (ex: https://seusite.com)
   • Não deve incluir /loja, /shop, etc.

🔍 Endpoint testado: ${url}/wp-json/
📊 Status HTTP: ${wpRestResponse.status}

Após fazer as correções, teste novamente a conexão.`,
          debug: {
            url: url,
            endpoint: `${url}/wp-json/`,
            status: wpRestResponse.status,
            error: errorText.substring(0, 200)
          }
        }
      }

      return {
        success: false,
        error: `Erro ao acessar WordPress REST API: HTTP ${wpRestResponse.status}. Verifique se WordPress está funcionando corretamente.`,
        debug: {
          status: wpRestResponse.status,
          error: errorText.substring(0, 100)
        }
      }
    }

    console.log('✅ WooCommerce - WordPress REST API OK!')

    // ETAPA 2: Testar autenticação na API WooCommerce
    console.log('🔍 WooCommerce - Testando autenticação WooCommerce API...')
    const response = await fetch(`${url}/wp-json/wc/v3/system_status`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    })

    console.log('🔍 WooCommerce - WooCommerce API status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ WooCommerce - Erro na autenticação:', error.substring(0, 200))

      // Verificar se é problema de autenticação
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: `❌ Erro de autenticação WooCommerce (HTTP ${response.status}).

🔑 VERIFIQUE AS CREDENCIAIS:

1️⃣ **GERAR NOVAS CHAVES API**
   • Acesse: WooCommerce → Configurações → Avançado → REST API
   • Clique em "Adicionar chave"
   • Descrição: "Lucaya Griffe Integration"
   • Usuário: Selecione um administrador
   • Permissões: Leitura/Gravação
   • Clique em "Gerar chave API"
   • Copie Consumer Key e Consumer Secret

2️⃣ **ATUALIZAR CREDENCIAIS**
   • Consumer Key deve começar com "ck_"
   • Consumer Secret deve começar com "cs_"
   • Cole as novas credenciais no sistema

🔍 Endpoint testado: ${url}/wp-json/wc/v3/system_status`,
          debug: {
            status: response.status,
            endpoint: `${url}/wp-json/wc/v3/system_status`
          }
        }
      }

      return {
        success: false,
        error: `HTTP ${response.status}: ${error.substring(0, 100)}`,
        debug: {
          status: response.status,
          error: error.substring(0, 200)
        }
      }
    }

    const data = await response.json()
    console.log('✅ WooCommerce - Conectado com sucesso!')

    return {
      success: true,
      message: `✅ Conectado à loja: ${data.settings?.title?.value || 'WooCommerce'}`,
      userData: {
        storeUrl: url,
        wcVersion: data.environment?.version || 'desconhecida',
        wpVersion: data.environment?.wp_version || 'desconhecida',
        restApiEnabled: true
      }
    }

  } catch (error) {
    return { success: false, error: error.message }
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { marketplace, credentials }: TestConnectionRequest = await req.json()

    // Debug log
    console.log('🔍 DEBUG - Marketplace:', marketplace)
    console.log('🔍 DEBUG - Credentials keys:', Object.keys(credentials || {}))

    if (!marketplace || !credentials) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Marketplace e credenciais são obrigatórios',
        debug: {
          marketplace: marketplace || 'undefined',
          credentials: credentials ? Object.keys(credentials) : 'undefined'
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
