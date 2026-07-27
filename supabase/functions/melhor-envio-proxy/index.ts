import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ME_BASE = 'https://melhorenvio.com.br/api/v2/me'

async function safeJson(res: Response): Promise<any> {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    if (res.status === 401 || res.status === 403) throw new Error('Token do Melhor Envio inválido ou expirado. Gere um novo em melhorenvio.com.br → Tokens de acesso.')
    throw new Error(`Melhor Envio retornou resposta inesperada (HTTP ${res.status}). Verifique o token nas Integrações.`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body_parsed = await req.json()
    const { method = 'GET', endpoint, body, action, order, order_id, company_id, kit_id, postal_code } = body_parsed

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

      // Resolve serviço ME a partir do pedido WooCommerce
      // Evita divergência entre o serviço escolhido no checkout e a etiqueta gerada
      const resolveServiceId = (): number => {
        const line = order.shipping_lines?.[0]

        if (line) {
          // Melhor Envio plugin guarda o ID do serviço no meta_data
          const metaId = line.meta_data?.find(
            (m: any) => m.key === '_melhor_envio_service_id' || m.key === 'service_id'
          )?.value
          if (metaId) return parseInt(metaId)

          // method_id costuma ter o formato "melhor_envio_correios_1" — extrai o número final
          const fromMethod = (line.method_id || '').match(/_(\d+)$/)
          if (fromMethod) return parseInt(fromMethod[1])

          // Fallback por palavras-chave no título (ex: "SEDEX", "PAC", "JadLog")
          const title = (line.method_title || line.title || '').toLowerCase()
          if (title.includes('sedex'))                              return 2
          if (title.includes('pac'))                               return 1
          if (title.includes('jadlog') && title.includes('pack'))  return 18
          if (title.includes('jadlog'))                            return 3
          if (title.includes('mini'))                              return 17
          if (title.includes('carta') || title.includes('impresso')) return 8
        }

        // Último recurso: default configurado nas Integrações
        return parseInt(extra.default_service) || 1
      }

      // 1. Adicionar ao carrinho ME
      const cartPayload = {
        service: resolveServiceId(), // 1=Correios PAC, 2=SEDEX, etc
        agency: null,
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
          name:        `${shipping.first_name || ''} ${shipping.last_name || ''}`.trim() || billing.first_name || '',
          phone:       (billing.phone || shipping.phone || (order.meta_data || []).find((m: any) => ['_billing_phone','billing_phone','phone'].includes(m.key))?.value || '').replace(/\D/g, ''),
          email:       billing.email || '',
          document:    (billing.document || billing.cpf || (order.meta_data || []).find((m: any) => ['_billing_cpf','billing_cpf','_cpf','cpf','vindi_cpf','wc_cpf'].includes(m.key))?.value || '').replace(/\D/g, ''),
          address:     shipping.address_1 || '',
          complement:  shipping.address_2 || '',
          number:      shipping.number || 'S/N',
          district:    shipping.neighborhood || '',
          city:        shipping.city || '',
          state_abbr:  shipping.state || '',
          postal_code: (shipping.postcode || '').replace(/\D/g, ''),
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
        const meMsg = typeof cartData.errors === 'object'
          ? Object.values(cartData.errors).flat().join(', ')
          : (cartData.message || JSON.stringify(cartData.errors || cartData))
        const userMsg = meMsg.toLowerCase().includes('saldo') || meMsg.toLowerCase().includes('insuficiente') || meMsg.toLowerCase().includes('balance')
          ? `Saldo insuficiente no Melhor Envio. Recarregue o saldo em melhorenvio.com.br e tente novamente.`
          : meMsg.toLowerCase().includes('phone') || meMsg.toLowerCase().includes('telefone')
          ? `Telefone do destinatário inválido ou ausente: ${meMsg}`
          : meMsg.toLowerCase().includes('document') || meMsg.toLowerCase().includes('cpf')
          ? `CPF do destinatário inválido ou ausente: ${meMsg}`
          : `Melhor Envio: ${meMsg}`
        throw new Error(userMsg)
      }

      const cartId = cartData.id

      // 2. Checkout (debita saldo)
      const checkoutRes = await fetch(`${ME_BASE}/shipment/checkout`, {
        method: 'POST',
        headers: meHeaders,
        body: JSON.stringify({ orders: [cartId] }),
      })
      const checkoutData = await checkoutRes.json()

      if (!checkoutRes.ok) {
        const msg = checkoutData.message || JSON.stringify(checkoutData)
        const userMsg = msg.toLowerCase().includes('saldo') || msg.toLowerCase().includes('insuficiente') || msg.toLowerCase().includes('balance')
          ? `Saldo insuficiente no Melhor Envio. Recarregue o saldo em melhorenvio.com.br e tente novamente.`
          : `Melhor Envio (checkout): ${msg}`
        throw new Error(userMsg)
      }

      // 3. Generate (prepara etiqueta para impressão)
      const generateRes = await fetch(`${ME_BASE}/shipment/generate`, {
        method: 'POST',
        headers: meHeaders,
        body: JSON.stringify({ orders: [cartId] }),
      })
      const generateData = await generateRes.json()

      if (!generateRes.ok) {
        throw new Error(generateData.message || 'Erro ao gerar etiqueta ME')
      }

      // 4. Print (URL pública do PDF — não exige login no ME)
      const printRes = await fetch(`${ME_BASE}/shipment/print`, {
        method: 'POST',
        headers: meHeaders,
        body: JSON.stringify({ mode: 'public', orders: [cartId] }),
      })
      const printData = await printRes.json()

      return new Response(JSON.stringify({
        label_url: printData.url || null,
        tracking:  generateData[cartId]?.tracking || cartData.tracking || null,
        cart_id:   cartId,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── Checkout + etiqueta do cart já criado (chamado pelo webhook após pagamento) ──
    if (action === 'checkout_kit_label') {
      const { cart_id } = body_parsed
      if (!cart_id) throw new Error('cart_id obrigatório para checkout_kit_label')

      const checkoutRes  = await fetch(`${ME_BASE}/shipment/checkout`, { method: 'POST', headers: meHeaders, body: JSON.stringify({ orders: [cart_id] }) })
      const checkoutData = await checkoutRes.json()
      if (!checkoutRes.ok) throw new Error(checkoutData.message || 'Erro no checkout ME')

      const generateRes  = await fetch(`${ME_BASE}/shipment/generate`, { method: 'POST', headers: meHeaders, body: JSON.stringify({ orders: [cart_id] }) })
      const generateData = await generateRes.json()
      if (!generateRes.ok) throw new Error(generateData.message || 'Erro ao gerar etiqueta ME')

      const printRes  = await fetch(`${ME_BASE}/shipment/print`, { method: 'POST', headers: meHeaders, body: JSON.stringify({ mode: 'public', orders: [cart_id] }) })
      const printData = await printRes.json()

      return new Response(JSON.stringify({
        label_url: printData.url || null,
        tracking:  generateData[cart_id]?.tracking || null,
        cart_id,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── Gerar etiqueta kit (pedido de landing page) ───────────────
    if (action === 'generate_kit_label') {
      const { kit_order, kit } = body_parsed || {}
      if (!kit_order || !kit) throw new Error('kit_order e kit são obrigatórios para generate_kit_label')

      const addr = kit_order.customer_address || {}
      const serviceId = kit_order.shipping_service_id || parseInt(extra.default_service) || 1
      const qty    = kit.quantity || 1
      const weight = parseFloat((kit.weight_kg * qty).toFixed(3))

      const cartPayload = {
        service: serviceId,
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
          name:        kit_order.customer_name  || 'Destinatário',
          phone:       (kit_order.customer_phone || '').replace(/\D/g, ''),
          email:       kit_order.customer_email || '',
          document:    (kit_order.customer_cpf  || '').replace(/\D/g, ''),
          address:     addr.street        || '',
          complement:  addr.complement    || '',
          number:      addr.number        || 'S/N',
          district:    addr.neighborhood  || '',
          city:        addr.city          || '',
          state_abbr:  addr.state         || '',
          postal_code: (addr.postal_code  || '').replace(/\D/g, ''),
          note:        '',
        },
        products: [{
          name:            kit.name,
          quantity:        qty,
          unitary_value:   parseFloat(kit.price) || 0,
          weight:          parseFloat(kit.weight_kg) || 0.3,
          width:           kit.width_cm  || 15,
          height:          kit.height_cm || 10,
          length:          kit.length_cm || 20,
          insurance_value: parseFloat(kit_order.kit_price) || 0,
        }],
        volumes: [{ height: kit.height_cm || 10, width: kit.width_cm || 15, length: kit.length_cm || 20, weight }],
        options: { insurance_value: parseFloat(kit_order.total_amount) || 0, receipt: false, own_hand: false, reverse: false, non_commercial: false },
        invoice: { key: '' },
      }

      const cartRes  = await fetch(`${ME_BASE}/cart`, { method: 'POST', headers: meHeaders, body: JSON.stringify(cartPayload) })
      const cartData = await cartRes.json()
      console.log('[ME] cart response HTTP', cartRes.status, JSON.stringify(cartData))
      if (!cartRes.ok || cartData.errors) throw new Error(JSON.stringify(cartData.errors ?? cartData.message ?? cartData))
      const cartId = cartData.id

      const checkoutRes = await fetch(`${ME_BASE}/shipment/checkout`, { method: 'POST', headers: meHeaders, body: JSON.stringify({ orders: [cartId] }) })
      const checkoutData = await checkoutRes.json()
      console.log('[ME] checkout response HTTP', checkoutRes.status, JSON.stringify(checkoutData))
      if (!checkoutRes.ok) throw new Error(JSON.stringify(checkoutData.message ?? checkoutData))

      const generateRes  = await fetch(`${ME_BASE}/shipment/generate`, { method: 'POST', headers: meHeaders, body: JSON.stringify({ orders: [cartId] }) })
      const generateData = await generateRes.json()
      console.log('[ME] generate response HTTP', generateRes.status, JSON.stringify(generateData))
      if (!generateRes.ok) throw new Error(JSON.stringify(generateData.message ?? generateData))

      const printRes  = await fetch(`${ME_BASE}/shipment/print`, { method: 'POST', headers: meHeaders, body: JSON.stringify({ mode: 'public', orders: [cartId] }) })
      const printData = await printRes.json()

      return new Response(JSON.stringify({
        label_url: printData.url || null,
        tracking:  generateData[cartId]?.tracking || cartData.tracking || null,
        cart_id:   cartId,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── Calcular frete ────────────────────────────────────────────
    if (action === 'calculate') {
      const senderCep = (extra.sender_cep || '').replace(/\D/g, '')
      if (!senderCep) throw new Error('CEP de origem não configurado nas credenciais do Melhor Envio.')

      const { data: kit } = await supabase
        .from('kits')
        .select('weight_kg, length_cm, width_cm, height_cm, quantity')
        .eq('id', kit_id)
        .eq('company_id', company_id)
        .single()

      if (!kit) throw new Error('Kit não encontrado para calcular o frete.')
      if (!kit.weight_kg) throw new Error('Peso do kit não cadastrado. Preencha o campo peso no cadastro do kit.')

      const qty    = kit.quantity || 1
      const weight = parseFloat((kit.weight_kg * qty).toFixed(3))

      const calcPayload = {
        from: {
          postal_code: senderCep,
          document:    (extra.sender_document || '').replace(/\D/g, ''),
        },
        to: { postal_code: (postal_code || '').replace(/\D/g, '') },
        package: {
          height: kit.height_cm || 10,
          width:  kit.width_cm  || 15,
          length: kit.length_cm || 20,
          weight,
        },
        options: { receipt: false, own_hand: false },
      }

      const calcRes  = await fetch(`${ME_BASE}/shipment/calculate`, {
        method:  'POST',
        headers: meHeaders,
        body:    JSON.stringify(calcPayload),
      })
      const calcData = await calcRes.json()

      // Retorna o array completo — o frontend filtra serviços disponíveis
      // Se não for array, é erro da API do ME
      if (!Array.isArray(calcData)) {
        throw new Error(calcData.message || calcData.error || JSON.stringify(calcData))
      }

      const allowedCarriers: string[] = (extra.allowed_carriers || '')
        .split(',')
        .map((c: string) => c.trim().toLowerCase())
        .filter(Boolean)

      const filtered = calcData.filter((s: any) => {
        if (s.error || !s.price || parseFloat(s.price) <= 0) return false
        if (allowedCarriers.length === 0) return true
        return allowedCarriers.some(c => s.company?.name?.toLowerCase().includes(c))
      })

      return new Response(JSON.stringify(filtered), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Requisição genérica ────────────────────────────────────────
    const url = endpoint ? `${ME_BASE}/${endpoint}` : ME_BASE
    const res = await fetch(url, {
      method,
      headers: meHeaders,
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const result = await safeJson(res)

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
