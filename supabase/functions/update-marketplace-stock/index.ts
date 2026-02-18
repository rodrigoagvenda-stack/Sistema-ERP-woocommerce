import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function updateWooCommerceStock(marketplaceProductId: string, stock: number, credentials: any): Promise<{ success: boolean; error?: string | null }> {
  try {
    let url = credentials.store_url.trim()
    if (!url.startsWith('http')) url = 'https://' + url
    url = url.replace(/\/+$/, '')

    const response = await fetch(
      `${url}/wp-json/wc/v3/products/${marketplaceProductId}?consumer_key=${encodeURIComponent(credentials.consumer_key)}&consumer_secret=${encodeURIComponent(credentials.consumer_secret)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_quantity: stock }),
      }
    )

    return { success: response.ok, error: response.ok ? null : await response.text() }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { productId, newStock } = await req.json()

    if (!productId || newStock === undefined) {
      return new Response(JSON.stringify({ error: 'productId e newStock são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Buscar produto vinculado ao WooCommerce (usando is_published, não is_active)
    const { data: marketplaceProducts, error: productsError } = await supabase
      .from('marketplace_products')
      .select('*, marketplace_credentials(*)')
      .eq('local_product_id', productId)
      .eq('marketplace', 'woocommerce')
      .eq('is_published', true)

    if (productsError) {
      return new Response(JSON.stringify({ error: productsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!marketplaceProducts || marketplaceProducts.length === 0) {
      return new Response(JSON.stringify({ error: 'Produto não publicado no WooCommerce' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const mp = marketplaceProducts[0]
    const credentials = mp.marketplace_credentials

    if (!credentials || !credentials.is_active) {
      return new Response(JSON.stringify({ error: 'Credenciais WooCommerce não encontradas ou inativas' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = await updateWooCommerceStock(mp.marketplace_product_id, newStock, credentials)

    await supabase
      .from('marketplace_products')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_status: result.success ? 'synced' : 'error',
        last_error: result.success ? null : result.error,
      })
      .eq('id', mp.id)

    await supabase.from('marketplace_sync_log').insert({
      local_product_id: productId,
      marketplace: 'woocommerce',
      marketplace_product_id: mp.marketplace_product_id,
      operation_type: 'sync_stock',
      status: result.success ? 'success' : 'error',
      error_message: result.error,
      request_payload: { new_stock: newStock },
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
