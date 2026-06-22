import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BLING_BASE = 'https://api.bling.com.br/Api/v3'

function resolveFormaPagamento(extra: any, paymentMethod: string = ''): number {
  const m = paymentMethod.toLowerCase()
  if (m.includes('boleto') || m.includes('bacs')) return Number(extra.fp_boleto) || 1
  if (m.includes('card') || m.includes('cartao') || m.includes('credit') || m.includes('stripe') || m.includes('cielo')) return Number(extra.fp_cartao) || 1
  return Number(extra.fp_pix) || 1
}

async function refreshBlingToken(supabase: any, company_id: string, extra: any): Promise<string | null> {
  const refreshToken = extra.refresh_token
  const clientId     = extra.client_id
  const clientSecret = extra.client_secret
  if (!refreshToken || !clientId || !clientSecret) return null

  const credentials = btoa(`${clientId}:${clientSecret}`)
  const res = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }).toString(),
  })

  if (!res.ok) return null
  const data = await res.json()
  if (!data.access_token) return null

  await supabase
    .from('marketplace_credentials')
    .update({
      access_token: data.access_token,
      extra_data: {
        ...extra,
        refresh_token:    data.refresh_token || refreshToken,
        token_expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
      },
    })
    .eq('marketplace', 'bling')
    .eq('company_id', company_id)

  return data.access_token
}

async function blingGet(url: string, headers: Record<string, string>) {
  const r = await fetch(url, { headers })
  return r.json()
}

async function resolveBlingProductId(sku: string, headers: Record<string, string>): Promise<number | null> {
  if (!sku) return null
  try {
    const r = await fetch(`${BLING_BASE}/produtos?codigo=${encodeURIComponent(sku)}&limite=1`, { headers })
    const d = await r.json()
    return d?.data?.[0]?.id || null
  } catch {
    return null
  }
}

async function resolveContatoId(cpf: string, nome: string, billing: any, shipping: any, headers: Record<string, string>): Promise<number | null> {
  try {
    const search = await blingGet(`${BLING_BASE}/contatos?cpf_cnpj=${cpf}&limite=1`, headers)
    const existing = search?.data?.[0]?.id
    if (existing) return existing

    const create = await fetch(`${BLING_BASE}/contatos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data: {
        nome,
        tipoPessoa: 'F',
        cpfCnpj: cpf,
        email:    billing.email || '',
        telefone: (billing.phone || '').replace(/\D/g, ''),
        endereco: {
          endereco:    shipping.address_1 || '',
          numero:      shipping.number || 'S/N',
          complemento: shipping.address_2 || '',
          bairro:      shipping.neighborhood || shipping.city || '',
          cep:         (shipping.postcode || '').replace(/\D/g, ''),
          municipio:   shipping.city || '',
          uf:          shipping.state || '',
          pais:        'Brasil',
        },
      }}),
    })
    const created = await create.json()
    return created?.data?.id || null
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { method = 'GET', endpoint, body, action, order, company_id } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: creds } = await supabase
      .from('marketplace_credentials')
      .select('access_token, extra_data')
      .eq('marketplace', 'bling')
      .eq('company_id', company_id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!creds?.access_token) {
      return new Response(JSON.stringify({ error: 'Bling não configurado. Acesse Integrações → Bling para configurar.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const extra = creds.extra_data || {}

    // Auto-refresh: renova se expirado ou próximo de expirar (5 min de margem)
    let token = creds.access_token
    const expiresAt = extra.token_expires_at ? new Date(extra.token_expires_at).getTime() : 0
    if (expiresAt && Date.now() > expiresAt - 5 * 60 * 1000) {
      const refreshed = await refreshBlingToken(supabase, company_id, extra)
      if (refreshed) token = refreshed
    }

    const blingHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    // ── Emitir NF-e ───────────────────────────────────────────────
    if (action === 'emit_nfe' && order) {
      const billing  = order.billing  || {}
      const shipping = order.shipping || billing

      const CPF_KEYS = ['_billing_cpf','billing_cpf','_cpf','cpf','vindi_cpf','wc_cpf']
      const cpfMeta = (order.meta_data || []).find((m: any) => CPF_KEYS.includes(m.key) && m.value)?.value || ''
      const cpf = (billing.cpf || billing.document || cpfMeta || '').replace(/\D/g, '')

      const today = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const dataHoje = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`

      const nome = `${billing.first_name || ''} ${billing.last_name || ''}`.trim()

      // Busca ou cria contato no Bling pelo CPF
      const contatoId = cpf ? await resolveContatoId(cpf, nome, billing, shipping, blingHeaders) : null

      // Se o token estava expirado, tenta refresh antes de emitir
      if (contatoId === null && cpf) {
        // Tenta refresh agora mesmo caso resolveContato falhou por 401
        const refreshed = await refreshBlingToken(supabase, company_id, extra)
        if (refreshed) {
          blingHeaders['Authorization'] = `Bearer ${refreshed}`
          token = refreshed
        }
      }

      // Busca ID do produto no Bling pelo SKU para cada item do pedido
      const blingItens = await Promise.all((order.line_items || []).map(async (item: any) => {
        const sku = String(item.sku || '')
        const blingId = sku ? await resolveBlingProductId(sku, blingHeaders) : null
        const valor = parseFloat(item.price) || (parseFloat(item.subtotal) / (Number(item.quantity) || 1)) || 0

        if (blingId) {
          return {
            produto:    { id: blingId },
            quantidade: Number(item.quantity) || 1,
            valor,
          }
        }

        // Fallback sem produto cadastrado no Bling
        return {
          codigo:     sku || `WC-${item.product_id}`,
          descricao:  item.name,
          unidade:    'UN',
          quantidade: Number(item.quantity) || 1,
          valor,
          tipo:       'P',
          origem:     0,
        }
      }))

      if (blingItens.length === 0) throw new Error('Pedido sem itens — não é possível emitir NF-e.')

      const contato = contatoId
        ? { id: contatoId }
        : { nome, tipoPessoa: 'F', cpfCnpj: cpf, email: billing.email || '', telefone: (billing.phone || '').replace(/\D/g, '') }

      const nfePayload: any = {
        tipo:         1,
        serie:        Number(extra.nfe_serie) || 3,
        dataOperacao: `${dataHoje}T00:00:00`,
        contato,
        itens: blingItens,
        parcelas: [{
          dataVencimento: dataHoje,
          valor:          parseFloat(order.total) || 0,
          formaPagamento: { id: resolveFormaPagamento(extra, order.payment_method) },
        }],
        transporte: { fretePorConta: 9, volumes: [] },
        informacoesAdicionais: {
          informacoesContribuinte: `Pedido WooCommerce #${order.number || order.id}`,
        },
      }

      if (extra.natureza_operacao_id) {
        nfePayload.naturezaOperacao = { id: Number(extra.natureza_operacao_id) }
      }

      let res = await fetch(`${BLING_BASE}/nfe`, {
        method: 'POST',
        headers: blingHeaders,
        body: JSON.stringify({ data: nfePayload }),
      })
      let result = await res.json()

      // Se deu invalid_token, tenta refresh e reenvia uma vez
      if (!res.ok && result?.error?.type === 'invalid_token') {
        const refreshed = await refreshBlingToken(supabase, company_id, extra)
        if (refreshed) {
          blingHeaders['Authorization'] = `Bearer ${refreshed}`
          res = await fetch(`${BLING_BASE}/nfe`, {
            method: 'POST',
            headers: blingHeaders,
            body: JSON.stringify({ data: nfePayload }),
          })
          result = await res.json()
        }
      }

      if (!res.ok) {
        const msg = result?.error?.fields?.map((f: any) => f.msg).join(', ') || result?.error?.description || JSON.stringify(result)
        return new Response(JSON.stringify({
          error: msg,
          __debug: { cpf, contatoId, contato, itensCount: blingItens.length, itens: blingItens, dataHoje, payload: nfePayload, blingRaw: result },
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const nfeId = result?.data?.id
      if (nfeId) {
        await fetch(`${BLING_BASE}/nfe/${nfeId}/enviar`, { method: 'POST', headers: blingHeaders })
      }

      return new Response(JSON.stringify({
        id:       nfeId,
        numero:   result?.data?.numero || '',
        situacao: result?.data?.situacao?.value || 'Emitida',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── Requisição genérica ────────────────────────────────────────
    const url = `${BLING_BASE}/${endpoint}`
    const res = await fetch(url, {
      method,
      headers: blingHeaders,
      ...(body ? { body: JSON.stringify({ data: body }) } : {}),
    })
    const result = await res.json()

    // Auto-refresh em requisições genéricas também
    if (!res.ok && result?.error?.type === 'invalid_token') {
      const refreshed = await refreshBlingToken(supabase, company_id, extra)
      if (refreshed) {
        const res2 = await fetch(url, {
          method,
          headers: { ...blingHeaders, 'Authorization': `Bearer ${refreshed}` },
          ...(body ? { body: JSON.stringify({ data: body }) } : {}),
        })
        const result2 = await res2.json()
        if (!res2.ok) throw new Error(result2?.error?.description || 'Erro Bling')
        return new Response(JSON.stringify(result2?.data || result2), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    if (!res.ok) throw new Error(result?.error?.description || 'Erro Bling')
    return new Response(JSON.stringify(result?.data || result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
