import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const log = (...args: unknown[]) => console.log('[MP-PREF]', ...args)

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { kit_id, company_id, coupon_code, payer, shipping_cost, shipping_name, shipping_service_id, customer_address } = await req.json()
    const ME_BASE = 'https://melhorenvio.com.br/api/v2/me'
    log(`kit_id=${kit_id} company_id=${company_id} coupon_code=${coupon_code || 'none'}`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Busca kit
    const { data: kit } = await supabase
      .from('kits')
      .select('*')
      .eq('id', kit_id)
      .eq('company_id', company_id)
      .eq('active', true)
      .single()

    if (!kit) throw new Error('Kit não encontrado ou inativo.')
    log(`kit: ${kit.name} R$${kit.price} peso=${kit.weight_g}g dim=${kit.dimensions}`)

    // Busca credenciais MP
    const { data: creds } = await supabase
      .from('marketplace_credentials')
      .select('access_token')
      .eq('marketplace', 'mercadopago')
      .eq('company_id', company_id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!creds?.access_token) throw new Error('Mercado Pago não configurado. Acesse Integrações → Mercado Pago.')

    // Valida cupom
    let coupon = null
    let discountAmount = 0
    let freeShipping = false

    if (coupon_code) {
      const { data: cp } = await supabase
        .from('coupons')
        .select('*')
        .eq('company_id', company_id)
        .eq('code', coupon_code.toUpperCase().trim())
        .eq('active', true)
        .single()

      if (!cp) throw new Error(`Cupom "${coupon_code}" inválido ou inativo.`)
      if (cp.expires_at && new Date(cp.expires_at) < new Date()) throw new Error(`Cupom "${coupon_code}" expirado.`)
      if (cp.max_uses && cp.uses_count >= cp.max_uses) throw new Error(`Cupom "${coupon_code}" esgotado.`)
      if (cp.kit_id && cp.kit_id !== kit_id) throw new Error(`Cupom "${coupon_code}" não é válido para este kit.`)

      coupon = cp
      const price = parseFloat(kit.price)

      if (cp.discount_type === 'percent') {
        discountAmount = parseFloat((price * cp.discount_value / 100).toFixed(2))
      } else if (cp.discount_type === 'fixed') {
        discountAmount = Math.min(parseFloat(cp.discount_value), price)
      } else if (cp.discount_type === 'free_shipping') {
        freeShipping = true
      }

      log(`cupom: ${cp.code} tipo=${cp.discount_type} desconto=${discountAmount} frete_gratis=${freeShipping}`)
    }

    const finalPrice = Math.max(0.01, parseFloat(kit.price) - discountAmount)
    const qty        = kit.quantity || 1
    const weightG    = Math.round((kit.weight_kg || 0.5) * qty * 1000)
    const lengthCm   = kit.length_cm || 20
    const widthCm    = kit.width_cm  || 15
    const heightCm   = kit.height_cm || 10
    log(`frete: ${qty}un × ${kit.weight_kg}kg = ${weightG}g | dim=${lengthCm}x${widthCm}x${heightCm}`)

    // Monta items com frete opcional
    const items: Record<string, unknown>[] = [{
      id:          kit.id,
      title:       kit.name,
      quantity:    1,
      unit_price:  finalPrice,
      currency_id: 'BRL',
    }]
    if (shipping_cost && shipping_cost > 0) {
      items.push({
        id:          'frete',
        title:       shipping_name || 'Frete',
        quantity:    1,
        unit_price:  parseFloat(parseFloat(shipping_cost).toFixed(2)),
        currency_id: 'BRL',
      })
    }

    // Monta preference
    const prefBody: Record<string, unknown> = {
      items,
      ...(payer ? {
        payer: {
          name:    payer.name.split(' ').slice(0, -1).join(' ') || payer.name,
          surname: payer.name.split(' ').slice(-1)[0] || '',
          email:   payer.email,
          phone: {
            area_code: payer.phone.replace(/\D/g,'').slice(0, 2),
            number:    payer.phone.replace(/\D/g,'').slice(2),
          },
        }
      } : {}),
      ...(kit.success_url ? {
        back_urls: { success: kit.success_url },
        auto_return: 'approved',
      } : {}),
      external_reference: `kit_${kit.id}_${Date.now()}`,
      notification_url:   `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook?company_id=${company_id}`,
    }

    const prefRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${creds.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prefBody),
    })

    const pref = await prefRes.json()
    log(`preference id=${pref.id} init_point=${pref.init_point}`)

    if (!prefRes.ok) throw new Error(pref.message || `Erro MP HTTP ${prefRes.status}`)

    // Incrementa uso do cupom
    if (coupon) {
      await supabase
        .from('coupons')
        .update({ uses_count: coupon.uses_count + 1 })
        .eq('id', coupon.id)
    }

    // Adiciona ao carrinho do ME imediatamente (sem checkout — sem debitar saldo)
    // Assim o pedido aparece no painel ME igual ao WooCommerce, antes do pagamento
    let meCartId: string | null = null
    if (customer_address && shipping_service_id) {
      try {
        const { data: meCreds } = await supabase
          .from('marketplace_credentials')
          .select('access_token, extra_data')
          .eq('marketplace', 'melhorenvio')
          .eq('company_id', company_id)
          .eq('is_active', true)
          .limit(1)
          .single()

        if (meCreds?.access_token) {
          const extra = meCreds.extra_data || {}
          const qty    = kit.quantity || 1
          const weight = parseFloat(((kit.weight_kg || 0.5) * qty).toFixed(3))
          const addr   = customer_address

          const cartPayload = {
            service: shipping_service_id,
            agency:  null,
            from: {
              name:             extra.sender_name     || 'Remetente',
              phone:            (extra.sender_phone   || '').replace(/\D/g, ''),
              email:            extra.sender_email    || '',
              company_document: (extra.sender_document || '').replace(/\D/g, ''),
              state_register:   extra.sender_state_register || 'ISENTO',
              address:          extra.sender_address  || '',
              complement:       extra.sender_complement || '',
              number:           extra.sender_number   || '',
              district:         extra.sender_district || '',
              city:             extra.sender_city     || '',
              state_abbr:       extra.sender_state    || '',
              postal_code:      (extra.sender_cep     || '').replace(/\D/g, ''),
              note:             '',
            },
            to: {
              name:        payer?.name  || 'Destinatário',
              phone:       (payer?.phone || '').replace(/\D/g, ''),
              email:       payer?.email || '',
              document:    '',
              address:     addr.street       || '',
              complement:  addr.complement   || '',
              number:      addr.number       || 'S/N',
              district:    addr.neighborhood || '',
              city:        addr.city         || '',
              state_abbr:  addr.state        || '',
              postal_code: (addr.postal_code || '').replace(/\D/g, ''),
              note:        '',
            },
            products: [{
              name:            kit.name,
              quantity:        qty,
              unitary_value:   finalPrice,
              weight:          kit.weight_kg || 0.3,
              width:           kit.width_cm  || 15,
              height:          kit.height_cm || 10,
              length:          kit.length_cm || 20,
              insurance_value: finalPrice,
            }],
            volumes: [{ height: kit.height_cm || 10, width: kit.width_cm || 15, length: kit.length_cm || 20, weight }],
            options: { insurance_value: finalPrice + (shipping_cost ? parseFloat(shipping_cost) : 0), receipt: false, own_hand: false, reverse: false, non_commercial: false },
            invoice: { key: '' },
          }

          const cartRes  = await fetch(`${ME_BASE}/cart`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${meCreds.access_token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': `ERP-Codigin (${extra.email || 'admin@codigin.com.br'})`,
            },
            body: JSON.stringify(cartPayload),
          })
          const cartData = await cartRes.json()
          if (cartRes.ok && cartData.id) {
            meCartId = cartData.id
            log(`ME cart criado: ${meCartId}`)
          } else {
            log('ME cart erro (não bloqueante):', JSON.stringify(cartData.errors || cartData.message))
          }
        }
      } catch (meErr) {
        log('ME cart exceção (não bloqueante):', meErr.message)
      }
    }

    // Salva pedido pendente
    await supabase.from('kit_orders').insert({
      company_id:          parseInt(company_id),
      kit_id,
      mp_preference_id:    pref.id,
      external_reference:  prefBody.external_reference,
      status:              'pending',
      customer_name:       payer?.name  || null,
      customer_email:      payer?.email || null,
      customer_phone:      payer?.phone || null,
      customer_cep:        customer_address?.postal_code || null,
      customer_address:    customer_address || null,
      shipping_service_id: shipping_service_id || null,
      me_cart_id:          meCartId,
      kit_name:            kit.name,
      kit_price:           finalPrice,
      shipping_cost:       shipping_cost ? parseFloat(shipping_cost) : 0,
      shipping_name:       shipping_name || null,
      discount_amount:     discountAmount,
      coupon_code:         coupon_code   || null,
      total_amount:        finalPrice + (shipping_cost ? parseFloat(shipping_cost) : 0),
    })

    return new Response(JSON.stringify({
      url:           pref.init_point,
      id:            pref.id,
      discount:      discountAmount,
      shipping_cost: shipping_cost || 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    console.error('[MP-PREF] ERRO:', e.message)
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
