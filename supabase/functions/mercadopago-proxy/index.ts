import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MP_BASE = 'https://api.mercadopago.com'

const log = (...args: unknown[]) => console.log('[MP-PROXY]', ...args)

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { method = 'GET', endpoint, body: reqBody, action, payment_id, amount, company_id, order } = await req.json()

    log(`action=${action} company_id=${company_id} payment_id=${payment_id ?? 'none'}`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: creds } = await supabase
      .from('marketplace_credentials')
      .select('access_token')
      .eq('marketplace', 'mercadopago')
      .eq('company_id', company_id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!creds?.access_token) {
      log('ERRO: credenciais não encontradas para company_id', company_id)
      return new Response(JSON.stringify({ error: 'Mercado Pago não configurado. Acesse Integrações → Mercado Pago para configurar.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const mpHeaders = {
      'Authorization': `Bearer ${creds.access_token}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': crypto.randomUUID(),
    }

    // ── Verificar pagamento ────────────────────────────────────────
    if (action === 'check_payment') {
      let pid = payment_id

      // Tenta buscar pelo external_reference se não tiver payment_id
      if (!pid && order) {
        const ref = order.number || order.id
        log(`payment_id não fornecido — buscando por external_reference: ${ref}`)
        const searchRes = await fetch(
          `${MP_BASE}/v1/payments/search?external_reference=${ref}&sort=date_created&criteria=desc`,
          { headers: mpHeaders }
        )
        const searchData = await searchRes.json()
        log(`search retornou ${searchData?.results?.length ?? 0} resultado(s)`)
        pid = searchData?.results?.[0]?.id
      }

      if (!pid) throw new Error('ID de pagamento Mercado Pago não encontrado no pedido. Verifique se o plugin MP está ativo e o pedido foi pago via MP.')

      log(`buscando payment/${pid}`)
      const res = await fetch(`${MP_BASE}/v1/payments/${pid}`, { headers: mpHeaders })
      const data = await res.json()
      log(`response: status=${data.status} detail=${data.status_detail} amount=${data.transaction_amount}`)

      if (!res.ok) throw new Error(data.message || `Erro MP HTTP ${res.status}`)

      return new Response(JSON.stringify({
        id:                 data.id,
        status:             data.status,
        status_detail:      data.status_detail,
        amount:             data.transaction_amount,
        method:             data.payment_method_id,
        type:               data.payment_type_id,
        payer_email:        data.payer?.email,
        payer_doc:          data.payer?.identification?.number,
        date_approved:      data.date_approved,
        external_reference: data.external_reference,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── Reembolso (total ou parcial) ──────────────────────────────
    if (action === 'refund') {
      if (!payment_id) throw new Error('payment_id obrigatório para reembolso.')
      log(`reembolso payment/${payment_id} amount=${amount ?? 'total'}`)

      const res = await fetch(`${MP_BASE}/v1/payments/${payment_id}/refunds`, {
        method: 'POST',
        headers: mpHeaders,
        body: JSON.stringify(amount ? { amount } : {}),
      })
      const data = await res.json()
      log(`refund response: id=${data.id} status=${data.status}`)

      if (!res.ok) throw new Error(data.message || `Erro reembolso MP HTTP ${res.status}`)

      return new Response(JSON.stringify({ refund_id: data.id, status: data.status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Requisição genérica ────────────────────────────────────────
    const url = `${MP_BASE}/${endpoint}`
    log(`generic ${method} ${url}`)
    const res = await fetch(url, {
      method,
      headers: mpHeaders,
      ...(reqBody ? { body: JSON.stringify(reqBody) } : {}),
    })
    const result = await res.json()
    log(`generic response HTTP ${res.status}`)

    if (!res.ok) {
      return new Response(JSON.stringify({ error: result?.message || 'Erro Mercado Pago' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (e) {
    console.error('[MP-PROXY] ERRO:', e.message)
    return new Response(JSON.stringify({ error: e.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
