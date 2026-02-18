import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
  category?: { id: number; name: string }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function syncToWooCommerce(product: Product, credentials: any): Promise<{ success: boolean; marketplaceId?: string; error?: string }> {
  try {
    if (!credentials.store_url || !credentials.consumer_key || !credentials.consumer_secret) {
      return { success: false, error: 'URL da loja, Consumer Key e Consumer Secret são obrigatórios' }
    }

    let url = credentials.store_url.trim().replace(/\/+$/, '')
    if (!url.startsWith('http')) url = 'https://' + url

    const payload: any = {
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
        height: product.height?.toString() || '0',
      },
    }

    if (product.category?.name) {
      payload.categories = [{ name: product.category.name }]
    }

    const endpoint = `${url}/wp-json/wc/v3/products?consumer_key=${encodeURIComponent(credentials.consumer_key)}&consumer_secret=${encodeURIComponent(credentials.consumer_secret)}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorJson = JSON.parse(errorText)
        return { success: false, error: `HTTP ${response.status}: ${errorJson.message || errorJson.code || 'Erro desconhecido'}` }
      } catch {
        return { success: false, error: `HTTP ${response.status}: ${errorText.substring(0, 100)}` }
      }
    }

    const data = await response.json()
    return { success: true, marketplaceId: data.id?.toString() }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { productId } = await req.json()

    if (!productId) {
      return new Response(JSON.stringify({ error: 'productId é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, category:categories(id, name)')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return new Response(JSON.stringify({ error: 'Produto não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: credentials } = await supabase
      .from('marketplace_credentials')
      .select('*')
      .eq('marketplace', 'woocommerce')
      .eq('is_active', true)
      .single()

    if (!credentials) {
      return new Response(JSON.stringify({ error: 'WooCommerce não configurado ou inativo' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = await syncToWooCommerce(product, credentials)

    if (result.success && result.marketplaceId) {
      await supabase.from('marketplace_products').upsert({
        local_product_id: productId,
        marketplace: 'woocommerce',
        marketplace_product_id: result.marketplaceId,
        is_published: true,
        sync_status: 'synced',
        last_sync_at: new Date().toISOString(),
      }, { onConflict: 'local_product_id,marketplace' })
    }

    await supabase.from('marketplace_sync_log').insert({
      local_product_id: productId,
      marketplace: 'woocommerce',
      marketplace_product_id: result.marketplaceId,
      operation_type: 'create',
      status: result.success ? 'success' : 'error',
      error_message: result.error,
      created_at: new Date().toISOString(),
    })

    return new Response(JSON.stringify({ success: result.success, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
