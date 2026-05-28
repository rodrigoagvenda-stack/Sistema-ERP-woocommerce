import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ME_BASE = 'https://melhorenvio.com.br/api/v2/me'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { method = 'GET', endpoint, body, action, order, order_id, company_id } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: creds } = await supabase
      .from('marketplace_credentials')
      .select('access_token, extra_data')
      .eq('marketplace', 'melhorenvio')
      .eq('company_id', company_id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!creds?.access_token) {
      return new Response(JSON.stringify({ error: 'Melhor Envio não configurado. Acesse Integrações → Melhor Envio para configurar.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = creds.access_token
    const extra = creds.extra_data || {}

    const meHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': `ERP-Codigin (${extra.email || 'admin@codigin.com.br'})`,
    }

    // ── Gerar etiqueta ─────────────────────────────────────────────
    if (action === 'generate_label' && order) {
      const shipping = order.shipping || {}
      const billing  = order.billing  || {}

      // 1. Adicionar ao carrinho ME
      const cartPayload = {
        service: extra.default_service || 1, // 1=Correios PAC, 2=SEDEX, etc
        agency: null,
        from: {
          name:       extra.sender_name     || 'Remetente',
          phone:      extra.sender_phone    || '',
          email:      extra.sender_email    || '',
          document:   extra.sender_document || '',
          address:    extra.sender_address  || '',
          complement: extra.sender_complement || '',
          number:     extra.sender_number   || '',
          district:   extra.sender_district || '',
          city:       extra.sender_city     || '',
          state_abbr: extra.sender_state    || '',
          postal_code:extra.sender_cep      || '',
          note:       '',
        },
        to: {
          name:        `${shipping.first_name || ''} ${shipping.last_name || ''}`.trim() || billing.first_name || '',
          phone:       billing.phone || '',
          email:       billing.email || '',
          document:    billing.document || '',
          address:     shipping.address_1 || '',
          complement:  shipping.address_2 || '',
          number:      shipping.number || 'S/N',
          district:    shipping.neighborhood || '',
          city:        shipping.city || '',
          state_abbr:  shipping.state || '',
          postal_code: (shipping.postcode || '').replace('-', ''),
          note:        '',
        },
        products: (order.line_items || []).map((item: any) => ({
          name:        item.name,
          quantity:    item.quantity,
          unitary_value: parseFloat(item.price) || 0,
          weight:      0.3,
          width:       12,
          height:      4,
          length:      17,
          insurance_value: parseFloat(item.total) || 0,
        })),
        volumes: [{ height: 10, width: 15, length: 20, weight: extra.default_weight || 0.5 }],
        options: { insurance_value: parseFloat(order.total) || 0, receipt: false, own_hand: false, reverse: false, non_commercial: false },
        invoice: { key: '' },
      }

      const cartRes = await fetch(`${ME_BASE}/cart`, {
        method: 'POST',
        headers: meHeaders,
        body: JSON.stringify(cartPayload),
      })
      const cartData = await cartRes.json()

      if (!cartRes.ok || cartData.errors) {
        throw new Error(JSON.stringify(cartData.errors || cartData.message || 'Erro ao adicionar ao carrinho ME'))
      }

      const cartId = cartData.id

      // 2. Checkout (gerar etiqueta)
      const checkoutRes = await fetch(`${ME_BASE}/shipment/checkout`, {
        method: 'POST',
        headers: meHeaders,
        body: JSON.stringify({ orders: [cartId] }),
      })
      const checkoutData = await checkoutRes.json()

      if (!checkoutRes.ok) {
        throw new Error(checkoutData.message || 'Erro no checkout ME')
      }

      // 3. Gerar PDF
      const printRes = await fetch(`${ME_BASE}/shipment/print`, {
        method: 'POST',
        headers: meHeaders,
        body: JSON.stringify({ mode: 'private', orders: [cartId] }),
      })
      const printData = await printRes.json()

      return new Response(JSON.stringify({
        label_url: printData.url || null,
        tracking: cartData.tracking || null,
        cart_id: cartId,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── Requisição genérica ────────────────────────────────────────
    const url = `${ME_BASE}/${endpoint}`
    const res = await fetch(url, {
      method,
      headers: meHeaders,
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const result = await res.json()

    if (!res.ok) {
      return new Response(JSON.stringify({ error: result?.message || 'Erro Melhor Envio' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
