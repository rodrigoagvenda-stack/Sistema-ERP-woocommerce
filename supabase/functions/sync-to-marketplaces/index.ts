import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Tipos
interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  weight?: number
  width?: number
  height?: number
  depth?: number
  images?: string[]
  category_id?: number
}

interface MarketplaceCredentials {
  marketplace: string
  is_active: boolean
  client_id?: string
  client_secret?: string
  access_token?: string
  refresh_token?: string
  store_url?: string
  seller_id?: string
  shop_id?: string
}

// Serviço base para marketplaces
abstract class MarketplaceService {
  abstract sync(product: Product, credentials: MarketplaceCredentials): Promise<{ success: boolean; marketplaceId?: string; error?: string }>

  async logSync(supabase: any, productId: number, marketplace: string, operation: string, status: string, error?: string, marketplaceId?: string) {
    await supabase.from('marketplace_sync_log').insert({
      local_product_id: productId,
      marketplace,
      marketplace_product_id: marketplaceId,
      operation_type: operation,
      status,
      error_message: error,
      created_at: new Date().toISOString()
    })
  }
}

// Implementação Mercado Livre
class MercadoLivreService extends MarketplaceService {
  async sync(product: Product, credentials: MarketplaceCredentials) {
    try {
      const payload = {
        title: product.name.substring(0, 60), // ML limita a 60 caracteres
        price: product.price,
        available_quantity: product.stock,
        currency_id: 'BRL',
        description: { plain_text: product.description },
        pictures: product.images?.map(img => ({ source: img })) || [],
        shipping: {
          mode: 'me2',
          dimensions: product.width && product.height && product.depth ? {
            width: `${product.width}cm`,
            height: `${product.height}cm`,
            length: `${product.depth}cm`
          } : undefined,
          free_shipping: false
        }
      }

      const response = await fetch('https://api.mercadolibre.com/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.text()
        return { success: false, error }
      }

      const data = await response.json()
      return { success: true, marketplaceId: data.id }

    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

// Implementação Shopee
class ShopeeService extends MarketplaceService {
  async sync(product: Product, credentials: MarketplaceCredentials) {
    try {
      const payload = {
        item_name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        images: product.images || [],
        weight: product.weight || 0,
        dimension: {
          package_width: product.width || 0,
          package_height: product.height || 0,
          package_length: product.depth || 0
        }
      }

      // Shopee usa Partner ID e Shop ID
      const response = await fetch(
        `https://partner.shopeemobile.com/api/v2/product/add_item?partner_id=${credentials.client_id}&shop_id=${credentials.shop_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': credentials.access_token || ''
          },
          body: JSON.stringify(payload)
        }
      )

      if (!response.ok) {
        const error = await response.text()
        return { success: false, error }
      }

      const data = await response.json()
      return { success: true, marketplaceId: data.item_id?.toString() }

    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

// Implementação TikTok Shop
class TikTokShopService extends MarketplaceService {
  async sync(product: Product, credentials: MarketplaceCredentials) {
    try {
      const payload = {
        product_name: product.name,
        description: product.description,
        price: { amount: product.price.toString(), currency: 'BRL' },
        stock: [{ available_stock: product.stock }],
        images: product.images?.map(url => ({ uri: url })) || [],
        package_weight: { value: (product.weight || 0).toString(), unit: 'KILOGRAM' },
        package_dimensions: {
          width: (product.width || 0).toString(),
          height: (product.height || 0).toString(),
          length: (product.depth || 0).toString(),
          unit: 'CENTIMETER'
        }
      }

      const response = await fetch(
        `https://open-api.tiktokglobalshop.com/api/products/create?shop_id=${credentials.shop_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tts-access-token': credentials.access_token || ''
          },
          body: JSON.stringify(payload)
        }
      )

      if (!response.ok) {
        const error = await response.text()
        return { success: false, error }
      }

      const data = await response.json()
      return { success: true, marketplaceId: data.data?.product_id }

    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

// Implementação Amazon
class AmazonService extends MarketplaceService {
  async sync(product: Product, credentials: MarketplaceCredentials) {
    // Amazon SP-API é mais complexa e requer vários passos
    // Aqui está uma implementação simplificada
    try {
      const payload = {
        productType: 'PRODUCT',
        requirements: 'LISTING',
        attributes: {
          item_name: [{ value: product.name, language_tag: 'pt_BR', marketplace_id: 'A2Q3Y263D00KWC' }],
          brand: [{ value: 'Lucaya Griffe', language_tag: 'pt_BR', marketplace_id: 'A2Q3Y263D00KWC' }],
          bullet_point: [{ value: product.description, language_tag: 'pt_BR', marketplace_id: 'A2Q3Y263D00KWC' }],
          main_product_image_locator: product.images?.[0] ? [{ media_location: product.images[0], marketplace_id: 'A2Q3Y263D00KWC' }] : [],
          list_price: [{ value: product.price, currency: 'BRL', marketplace_id: 'A2Q3Y263D00KWC' }],
          fulfillment_availability: [{
            fulfillment_channel_code: 'DEFAULT',
            quantity: product.stock
          }]
        }
      }

      // Nota: Amazon SP-API requer autenticação complexa com assinatura de requisições
      // Esta é uma versão simplificada
      return { success: false, error: 'Amazon SP-API requer configuração avançada' }

    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

// Implementação WooCommerce
class WooCommerceService extends MarketplaceService {
  async sync(product: Product, credentials: any) {
    try {
      console.log('🔍 WooCommerce Sync - Produto:', product.id, product.name)
      console.log('🔍 WooCommerce Sync - store_url:', credentials.store_url)
      console.log('🔍 WooCommerce Sync - consumer_key:', credentials.consumer_key ? 'presente' : 'ausente')
      console.log('🔍 WooCommerce Sync - consumer_secret:', credentials.consumer_secret ? 'presente' : 'ausente')

      if (!credentials.store_url || !credentials.consumer_key || !credentials.consumer_secret) {
        return {
          success: false,
          error: 'URL da loja, Consumer Key e Consumer Secret são obrigatórios'
        }
      }

      // Validar e normalizar URL
      let url = credentials.store_url.trim()
      if (!url.startsWith('http')) {
        url = 'https://' + url
      }
      // Remover trailing slash para evitar URLs com //
      url = url.replace(/\/+$/, '')

      const payload = {
        name: product.name,
        type: 'simple',
        regular_price: product.price.toString(),
        description: product.description,
        manage_stock: true,
        stock_quantity: product.stock,
        images: product.images?.map(src => ({ src })) || [],
        weight: product.weight?.toString() || '0',
        dimensions: {
          length: product.depth?.toString() || '0',
          width: product.width?.toString() || '0',
          height: product.height?.toString() || '0'
        }
      }

      console.log('🔍 WooCommerce Sync - Payload:', JSON.stringify(payload).substring(0, 200) + '...')

      const auth = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`)
      const endpoint = `${url}/wp-json/wc/v3/products`

      console.log('🔍 WooCommerce Sync - URL completa:', endpoint)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      console.log('🔍 WooCommerce Sync - Response status:', response.status)
      console.log('🔍 WooCommerce Sync - Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ WooCommerce Sync - Erro completo:', errorText.substring(0, 500))

        // Tentar parsear como JSON para pegar mensagem de erro específica do WooCommerce
        try {
          const errorJson = JSON.parse(errorText)
          const errorMsg = errorJson.message || errorJson.code || 'Erro desconhecido'
          return { success: false, error: `HTTP ${response.status}: ${errorMsg}` }
        } catch {
          // Se não for JSON, retornar trecho do erro
          const shortError = errorText.includes('<!doctype') || errorText.includes('<html')
            ? 'Página HTML retornada (404) - Verifique se a API WooCommerce está habilitada'
            : errorText.substring(0, 200)
          return { success: false, error: `HTTP ${response.status}: ${shortError}` }
        }
      }

      const data = await response.json()
      console.log('✅ WooCommerce Sync - Produto criado! ID:', data.id)

      return { success: true, marketplaceId: data.id?.toString() }

    } catch (error) {
      console.error('❌ WooCommerce Sync - Exception:', error)
      return { success: false, error: error.message }
    }
  }
}

// Factory para criar serviços
function getMarketplaceService(marketplace: string): MarketplaceService | null {
  switch (marketplace) {
    case 'mercado_livre': return new MercadoLivreService()
    case 'shopee': return new ShopeeService()
    case 'tiktok': return new TikTokShopService()
    case 'amazon': return new AmazonService()
    case 'woocommerce': return new WooCommerceService()
    default: return null
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
    const { productId, marketplaces } = await req.json()

    if (!productId) {
      return new Response(JSON.stringify({ error: 'Product ID é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar produto
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return new Response(JSON.stringify({ error: 'Produto não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Buscar credenciais dos marketplaces ativos
    const { data: credentials } = await supabase
      .from('marketplace_credentials')
      .select('*')
      .eq('is_active', true)

    if (!credentials || credentials.length === 0) {
      return new Response(JSON.stringify({ error: 'Nenhum marketplace configurado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Filtrar marketplaces se especificado
    const targetMarketplaces = marketplaces || credentials.map((c: any) => c.marketplace)

    // Sincronizar com cada marketplace
    const results = []
    for (const cred of credentials) {
      if (!targetMarketplaces.includes(cred.marketplace)) continue

      const service = getMarketplaceService(cred.marketplace)
      if (!service) continue

      const result = await service.sync(product, cred)

      // Salvar/atualizar mapeamento
      if (result.success && result.marketplaceId) {
        await supabase.from('marketplace_products').upsert({
          local_product_id: productId,
          marketplace: cred.marketplace,
          marketplace_product_id: result.marketplaceId,
          is_published: true,
          sync_status: 'synced',
          last_sync_at: new Date().toISOString()
        }, { onConflict: 'local_product_id,marketplace' })
      }

      // Log
      await service.logSync(
        supabase,
        productId,
        cred.marketplace,
        'create',
        result.success ? 'success' : 'error',
        result.error,
        result.marketplaceId
      )

      results.push({
        marketplace: cred.marketplace,
        success: result.success,
        marketplaceId: result.marketplaceId,
        error: result.error
      })
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
