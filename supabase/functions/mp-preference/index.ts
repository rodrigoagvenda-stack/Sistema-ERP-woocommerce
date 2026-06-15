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
    const { kit_id, company_id, coupon_code } = await req.json()
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

    // Monta preference
    const prefBody: Record<string, unknown> = {
      items: [{
        id:          kit.id,
        title:       kit.name,
        quantity:    1,
        unit_price:  finalPrice,
        currency_id: 'BRL',
      }],
      shipments: {
        mode: 'me2',
        dimensions: `${lengthCm}x${widthCm}x${heightCm},${weightG}`,
        local_pickup: false,
        ...(freeShipping ? { cost: 0, free_shipping: true } : {}),
      },
      ...(kit.success_url ? {
        back_urls: { success: kit.success_url },
        auto_return: 'approved',
      } : {}),
      external_reference: `kit_${kit.id}_${Date.now()}`,
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

    return new Response(JSON.stringify({
      url: pref.init_point,
      id: pref.id,
      discount: discountAmount,
      free_shipping: freeShipping,
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
