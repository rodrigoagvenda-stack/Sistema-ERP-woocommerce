import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url        = new URL(req.url)
    const company_id = url.searchParams.get('company_id')
    if (!company_id) return new Response('missing company_id', { status: 400 })

    const body = await req.json()
    console.log('[MP-WEBHOOK]', JSON.stringify(body))

    // MP envia type=payment e data.id com o payment_id
    if (body.type !== 'payment' || !body.data?.id) {
      return new Response('ok', { status: 200 })
    }

    const paymentId = String(body.data.id)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Busca credenciais MP da empresa
    const { data: creds } = await supabase
      .from('marketplace_credentials')
      .select('access_token')
      .eq('marketplace', 'mercadopago')
      .eq('company_id', company_id)
      .eq('is_active', true)
      .single()

    if (!creds?.access_token) {
      console.error('[MP-WEBHOOK] Sem credenciais MP para company_id', company_id)
      return new Response('ok', { status: 200 })
    }

    // Busca detalhes do pagamento no MP
    const mpRes  = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${creds.access_token}` },
    })
    const payment = await mpRes.json()
    console.log('[MP-WEBHOOK] status:', payment.status, 'ref:', payment.external_reference)

    if (!payment.external_reference) {
      return new Response('ok', { status: 200 })
    }

    // Mapeia status do MP para o nosso
    const statusMap: Record<string, string> = {
      approved:    'approved',
      pending:     'pending',
      in_process:  'pending',
      rejected:    'rejected',
      cancelled:   'cancelled',
      refunded:    'refunded',
      charged_back: 'refunded',
    }
    const newStatus = statusMap[payment.status] || payment.status

    // Detecta método de pagamento
    const methodMap: Record<string, string> = {
      credit_card:  'Cartão de crédito',
      debit_card:   'Cartão de débito',
      ticket:       'Boleto',
      bank_transfer: 'Pix',
      account_money: 'Saldo MP',
    }
    const paymentMethod = methodMap[payment.payment_type_id] || payment.payment_type_id

    // Atualiza kit_order
    const { data: order, error } = await supabase
      .from('kit_orders')
      .update({
        status:         newStatus,
        mp_payment_id:  paymentId,
        payment_method: paymentMethod,
      })
      .eq('external_reference', payment.external_reference)
      .select('id, kit_id, company_id, customer_name, customer_email, customer_phone, customer_address, shipping_service_id, shipping_cost, total_amount, kit_name, kit_price, me_cart_id')
      .single()

    if (error) {
      console.error('[MP-WEBHOOK] Erro ao atualizar kit_order:', error.message)
      return new Response('ok', { status: 200 })
    }

    console.log('[MP-WEBHOOK] kit_order atualizado:', order?.id, '->', newStatus)

    // Decrementa estoque do kit ao aprovar
    if (newStatus === 'approved' && order?.kit_id) {
      const { data: kit } = await supabase
        .from('kits')
        .select('stock_qty, quantity')
        .eq('id', order.kit_id)
        .single()

      if (kit?.stock_qty != null) {
        const novoEstoque = Math.max(0, kit.stock_qty - (kit.quantity || 1))
        await supabase.from('kits').update({ stock_qty: novoEstoque }).eq('id', order.kit_id)
        console.log('[MP-WEBHOOK] estoque decrementado:', kit.stock_qty, '->', novoEstoque)
      }
    }

    // Faz checkout do carrinho ME quando pagamento aprovado
    if (newStatus === 'approved' && order?.me_cart_id) {
      try {
        const { data: meCreds } = await supabase
          .from('marketplace_credentials')
          .select('access_token, extra_data')
          .eq('marketplace', 'melhorenvio')
          .eq('company_id', company_id)
          .eq('is_active', true)
          .single()

        if (meCreds?.access_token) {
          const ME_BASE   = 'https://melhorenvio.com.br/api/v2/me'
          const extra     = meCreds.extra_data || {}
          const meHeaders = {
            'Authorization': `Bearer ${meCreds.access_token}`,
            'Content-Type':  'application/json',
            'Accept':        'application/json',
            'User-Agent':    `ERP-Codigin (${extra.email || 'admin@codigin.com.br'})`,
          }
          const cartId = order.me_cart_id

          const checkoutRes  = await fetch(`${ME_BASE}/shipment/checkout`, {
            method: 'POST', headers: meHeaders,
            body: JSON.stringify({ orders: [cartId] }),
          })
          const checkoutData = await checkoutRes.json()
          if (!checkoutRes.ok) throw new Error(checkoutData.message || 'Erro checkout ME')
          console.log('[MP-WEBHOOK] ME checkout ok:', cartId)

          const generateRes  = await fetch(`${ME_BASE}/shipment/generate`, {
            method: 'POST', headers: meHeaders,
            body: JSON.stringify({ orders: [cartId] }),
          })
          const generateData = await generateRes.json()
          const tracking = generateData[cartId]?.tracking || null
          console.log('[MP-WEBHOOK] ME generate ok, tracking:', tracking)

          if (tracking) {
            await supabase.from('kit_orders').update({ tracking_code: tracking }).eq('id', order.id)
          }
        }
      } catch (meErr) {
        console.error('[MP-WEBHOOK] ME checkout erro (não bloqueia):', meErr.message)
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    console.error('[MP-WEBHOOK] ERRO:', e.message)
    return new Response(JSON.stringify({ error: e.message }), { status: 200 })
  }
})
