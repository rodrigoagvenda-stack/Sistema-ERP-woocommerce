import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

async function handleWooCommerceWebhook(body: any, supabase: any) {
  // Registrar log do webhook
  await supabase.from('marketplace_sync_log').insert({
    marketplace: 'woocommerce',
    marketplace_product_id: body.id?.toString(),
    operation_type: body.line_items ? 'order_webhook' : 'webhook_received',
    status: 'success',
    request_payload: body,
    created_at: new Date().toISOString(),
  })

  // Pedido recebido: atualizar estoque local
  if (body.id && body.line_items) {
    for (const item of body.line_items) {
      const { data: mapping } = await supabase
        .from('marketplace_products')
        .select('local_product_id')
        .eq('marketplace', 'woocommerce')
        .eq('marketplace_product_id', item.product_id.toString())
        .single()

      if (mapping) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', mapping.local_product_id)
          .single()

        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity)
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', mapping.local_product_id)
        }
      }
    }
  }

  return { success: true }
}

serve(async (req) => {
  try {
    const body = await req.json()

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const result = await handleWooCommerceWebhook(body, supabase)

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
