import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Processar webhook do Mercado Livre
async function handleMercadoLivreWebhook(body: any, supabase: any) {
  const { resource, topic } = body

  // Tópicos: orders, items, questions, claims
  if (topic === 'items') {
    // Produto foi atualizado no ML
    const itemId = resource.split('/').pop()

    // Buscar mapeamento
    const { data: mapping } = await supabase
      .from('marketplace_products')
      .select('*')
      .eq('marketplace', 'mercado_livre')
      .eq('marketplace_product_id', itemId)
      .single()

    if (mapping) {
      // Buscar dados atualizados do item no ML (requer chamada à API)
      // Por enquanto só registra log
      await supabase.from('marketplace_sync_log').insert({
        local_product_id: mapping.local_product_id,
        marketplace: 'mercado_livre',
        marketplace_product_id: itemId,
        operation_type: 'webhook_received',
        status: 'success',
        request_payload: body,
        created_at: new Date().toISOString()
      })
    }
  }

  if (topic === 'orders') {
    // Pedido foi criado/atualizado
    const orderId = resource.split('/').pop()

    await supabase.from('marketplace_sync_log').insert({
      marketplace: 'mercado_livre',
      marketplace_product_id: orderId,
      operation_type: 'order_webhook',
      status: 'success',
      request_payload: body,
      created_at: new Date().toISOString()
    })

    // Aqui você pode chamar update-marketplace-stock para sincronizar estoque
  }

  return { success: true }
}

// Processar webhook da Shopee
async function handleShopeeWebhook(body: any, supabase: any) {
  const { code, data } = body

  // code pode ser: 0 (sucesso), outros (erro)
  // event types: ORDER_CREATED, ORDER_CANCELLED, PRODUCT_UPDATE, etc

  if (data?.ordersn) {
    // Webhook de pedido
    await supabase.from('marketplace_sync_log').insert({
      marketplace: 'shopee',
      marketplace_product_id: data.ordersn,
      operation_type: 'order_webhook',
      status: code === 0 ? 'success' : 'error',
      request_payload: body,
      created_at: new Date().toISOString()
    })
  }

  return { success: true }
}

// Processar webhook do TikTok Shop
async function handleTikTokWebhook(body: any, supabase: any) {
  const { type, data } = body

  // Types: ORDER_STATUS_CHANGE, PRODUCT_CHANGE, etc
  if (type === 'ORDER_STATUS_CHANGE') {
    await supabase.from('marketplace_sync_log').insert({
      marketplace: 'tiktok',
      marketplace_product_id: data?.order_id,
      operation_type: 'order_webhook',
      status: 'success',
      request_payload: body,
      created_at: new Date().toISOString()
    })
  }

  return { success: true }
}

// Processar webhook do WooCommerce
async function handleWooCommerceWebhook(body: any, supabase: any) {
  // WooCommerce envia webhooks customizados
  // Geralmente vem com topic no header X-WC-Webhook-Topic

  if (body.id && body.status) {
    // Webhook de pedido
    await supabase.from('marketplace_sync_log').insert({
      marketplace: 'woocommerce',
      marketplace_product_id: body.id.toString(),
      operation_type: 'order_webhook',
      status: 'success',
      request_payload: body,
      created_at: new Date().toISOString()
    })

    // Se o pedido foi criado, atualizar estoque
    if (body.line_items) {
      for (const item of body.line_items) {
        // Buscar mapeamento do produto
        const { data: mapping } = await supabase
          .from('marketplace_products')
          .select('local_product_id')
          .eq('marketplace', 'woocommerce')
          .eq('marketplace_product_id', item.product_id.toString())
          .single()

        if (mapping) {
          // Buscar estoque atual
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', mapping.local_product_id)
            .single()

          if (product) {
            // Diminuir estoque
            const newStock = Math.max(0, product.stock - item.quantity)
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', mapping.local_product_id)

            // Sincronizar estoque com outros marketplaces
            // Pode chamar a edge function update-marketplace-stock aqui
          }
        }
      }
    }
  }

  return { success: true }
}

// Processar webhook da Amazon
async function handleAmazonWebhook(body: any, supabase: any) {
  // Amazon usa SNS (Simple Notification Service)
  // Webhook chega em formato específico

  await supabase.from('marketplace_sync_log').insert({
    marketplace: 'amazon',
    operation_type: 'webhook_received',
    status: 'success',
    request_payload: body,
    created_at: new Date().toISOString()
  })

  return { success: true }
}

serve(async (req) => {
  try {
    // Extrair marketplace do path ou query
    const url = new URL(req.url)
    const marketplace = url.searchParams.get('marketplace') || url.pathname.split('/').pop()

    if (!marketplace) {
      return new Response(JSON.stringify({ error: 'Marketplace não especificado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parsear body
    const body = await req.json()

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Processar webhook baseado no marketplace
    let result
    switch (marketplace) {
      case 'mercado_livre':
        result = await handleMercadoLivreWebhook(body, supabase)
        break
      case 'shopee':
        result = await handleShopeeWebhook(body, supabase)
        break
      case 'tiktok':
        result = await handleTikTokWebhook(body, supabase)
        break
      case 'woocommerce':
        result = await handleWooCommerceWebhook(body, supabase)
        break
      case 'amazon':
        result = await handleAmazonWebhook(body, supabase)
        break
      default:
        return new Response(JSON.stringify({ error: 'Marketplace não suportado' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
    }

    return new Response(JSON.stringify({ success: true, marketplace, result }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
