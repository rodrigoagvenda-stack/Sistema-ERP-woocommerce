import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface StockUpdate {
  productId: number
  newStock: number
  marketplaces?: string[]
}

// Atualizar estoque no Mercado Livre
async function updateMercadoLivreStock(marketplaceProductId: string, stock: number, accessToken: string) {
  try {
    const response = await fetch(`https://api.mercadolibre.com/items/${marketplaceProductId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ available_quantity: stock })
    })

    return { success: response.ok, error: response.ok ? null : await response.text() }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Atualizar estoque na Shopee
async function updateShopeeStock(marketplaceProductId: string, stock: number, credentials: any) {
  try {
    const response = await fetch(
      `https://partner.shopeemobile.com/api/v2/product/update_stock?partner_id=${credentials.client_id}&shop_id=${credentials.shop_id}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': credentials.access_token
        },
        body: JSON.stringify({
          item_id: parseInt(marketplaceProductId),
          stock_list: [{ stock }]
        })
      }
    )

    return { success: response.ok, error: response.ok ? null : await response.text() }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Atualizar estoque no TikTok Shop
async function updateTikTokStock(marketplaceProductId: string, stock: number, credentials: any) {
  try {
    const response = await fetch(
      `https://open-api.tiktokglobalshop.com/api/products/stocks?shop_id=${credentials.shop_id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tts-access-token': credentials.access_token
        },
        body: JSON.stringify({
          product_id: marketplaceProductId,
          skus: [{ available_stock: stock }]
        })
      }
    )

    return { success: response.ok, error: response.ok ? null : await response.text() }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Atualizar estoque no WooCommerce
async function updateWooCommerceStock(marketplaceProductId: string, stock: number, credentials: any) {
  try {
    // Validar e normalizar URL
    let url = credentials.store_url.trim()
    if (!url.startsWith('http')) {
      url = 'https://' + url
    }
    url = url.replace(/\/+$/, '')

    const response = await fetch(
      `${url}/wp-json/wc/v3/products/${marketplaceProductId}?consumer_key=${encodeURIComponent(credentials.consumer_key)}&consumer_secret=${encodeURIComponent(credentials.consumer_secret)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stock_quantity: stock })
      }
    )

    return { success: response.ok, error: response.ok ? null : await response.text() }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Atualizar estoque na Amazon (Placeholder - Amazon é mais complexa)
async function updateAmazonStock(marketplaceProductId: string, stock: number, credentials: any) {
  // Amazon SP-API requer processo mais complexo com feeds XML
  return { success: false, error: 'Amazon SP-API requer configuração avançada' }
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
    const { productId, newStock, marketplaces }: StockUpdate = await req.json()

    if (!productId || newStock === undefined) {
      return new Response(JSON.stringify({ error: 'productId e newStock são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar produtos vinculados aos marketplaces
    const { data: marketplaceProducts, error: productsError } = await supabase
      .from('marketplace_products')
      .select('*, marketplace_credentials(*)')
      .eq('local_product_id', productId)
      .eq('is_active', true)

    if (productsError) {
      return new Response(JSON.stringify({ error: productsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!marketplaceProducts || marketplaceProducts.length === 0) {
      return new Response(JSON.stringify({ error: 'Produto não está vinculado a nenhum marketplace' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Filtrar marketplaces se especificado
    const targetProducts = marketplaces
      ? marketplaceProducts.filter((p: any) => marketplaces.includes(p.marketplace))
      : marketplaceProducts

    const results = []

    for (const mp of targetProducts) {
      const credentials = mp.marketplace_credentials

      if (!credentials || !credentials.is_active) {
        results.push({
          marketplace: mp.marketplace,
          success: false,
          error: 'Credenciais não encontradas ou inativas'
        })
        continue
      }

      // Buscar configuração de estoque
      const { data: stockConfig } = await supabase
        .from('marketplace_stock_config')
        .select('*')
        .eq('marketplace', mp.marketplace)
        .single()

      // Calcular estoque a enviar (aplicando buffer e max_quantity)
      let stockToSync = newStock
      if (stockConfig) {
        stockToSync = Math.max(0, newStock - (stockConfig.stock_buffer || 0))
        if (stockConfig.max_quantity) {
          stockToSync = Math.min(stockToSync, stockConfig.max_quantity)
        }
      }

      // Atualizar estoque no marketplace
      let result
      switch (mp.marketplace) {
        case 'mercado_livre':
          result = await updateMercadoLivreStock(mp.marketplace_product_id, stockToSync, credentials.access_token)
          break
        case 'shopee':
          result = await updateShopeeStock(mp.marketplace_product_id, stockToSync, credentials)
          break
        case 'tiktok':
          result = await updateTikTokStock(mp.marketplace_product_id, stockToSync, credentials)
          break
        case 'woocommerce':
          result = await updateWooCommerceStock(mp.marketplace_product_id, stockToSync, credentials)
          break
        case 'amazon':
          result = await updateAmazonStock(mp.marketplace_product_id, stockToSync, credentials)
          break
        default:
          result = { success: false, error: 'Marketplace não suportado' }
      }

      // Atualizar status
      if (result.success) {
        await supabase
          .from('marketplace_products')
          .update({
            last_sync_at: new Date().toISOString(),
            sync_status: 'synced',
            last_error: null
          })
          .eq('id', mp.id)
      } else {
        await supabase
          .from('marketplace_products')
          .update({
            sync_status: 'error',
            last_error: result.error
          })
          .eq('id', mp.id)
      }

      // Log
      await supabase.from('marketplace_sync_log').insert({
        local_product_id: productId,
        marketplace: mp.marketplace,
        marketplace_product_id: mp.marketplace_product_id,
        operation_type: 'sync_stock',
        status: result.success ? 'success' : 'error',
        error_message: result.error,
        request_payload: { new_stock: stockToSync },
        created_at: new Date().toISOString()
      })

      results.push({
        marketplace: mp.marketplace,
        success: result.success,
        stockSent: stockToSync,
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
