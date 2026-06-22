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

async function resolveBlingProductId(sku: string, name: string, headers: Record<string, string>): Promise<number | null> {
  // Tenta por SKU primeiro
  if (sku) {
    try {
      const r = await fetch(`${BLING_BASE}/produtos?codigo=${encodeURIComponent(sku)}&limite=1`, { headers })
      const d = await r.json()
      if (d?.data?.[0]?.id) return d.data[0].id
    } catch {}
  }
  // Fallback: busca pelo nome do produto
  if (name) {
    try {
      const r = await fetch(`${BLING_BASE}/produtos?descricao=${encodeURIComponent(name.substring(0, 60))}&limite=5`, { headers })
      const d = await r.json()
      // Tenta match exato pelo nome
      const exact = d?.data?.find((p: any) => p.descricao?.toLowerCase() === name.toLowerCase())
      if (exact?.id) return exact.id
      if (d?.data?.[0]?.id) return d.data[0].id
    } catch {}
  }
  return null
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
    const { method = 'GET', endpoint, body, action, order, company_id, nfe_id, nfe_number, nfe_cpf } = await req.json()

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
      if (!extra.natureza_operacao_id) {
        return new Response(JSON.stringify({ error: 'Configure o "ID Natureza de Operação" nas Integrações → Bling antes de emitir NF-e.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const billing  = order.billing  || {}
      const shipping = order.shipping || billing

      const CPF_KEYS = ['_billing_cpf','billing_cpf','_cpf','cpf','vindi_cpf','wc_cpf']
      const cpfMeta = (order.meta_data || []).find((m: any) => CPF_KEYS.includes(m.key) && m.value)?.value || ''
      const cpf = (billing.cpf || billing.document || cpfMeta || '').replace(/\D/g, '')

      if (!cpf) throw new Error('CPF do cliente não encontrado no pedido — necessário para emitir NF-e.')

      const pad = (n: number) => String(n).padStart(2, '0')
      const orderDate = order.date_created ? new Date(order.date_created) : new Date()
      const dataOperacao = `${orderDate.getFullYear()}-${pad(orderDate.getMonth()+1)}-${pad(orderDate.getDate())}`
      const today = new Date()
      const dataHoje = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`

      const nome = `${billing.first_name || ''} ${billing.last_name || ''}`.trim()

      // Itens: campo required é "codigo" (string), não produto.id
      const blingItens = (order.line_items || []).map((item: any) => ({
        codigo:     String(item.sku || `WC-${item.product_id}`),
        descricao:  item.name,
        unidade:    'UN',
        quantidade: Number(item.quantity) || 1,
        valor:      parseFloat(item.price) || (parseFloat(item.subtotal) / (Number(item.quantity) || 1)) || 0,
      }))

      if (blingItens.length === 0) throw new Error('Pedido sem itens — não é possível emitir NF-e.')

      // Bug 1.1 — contato com endereço completo (municipio, bairro, logradouro obrigatórios)
      const tipoPessoa = cpf.length === 14 ? 'J' : 'F'
      const addr = order.shipping?.address_1 ? order.shipping : billing
      const contato: any = {
        nome,
        tipoPessoa,
        numeroDocumento: cpf,
        contribuinte: 9,
        endereco: {
          endereco:  addr.address_1 || '',
          numero:    addr.number    || 'S/N',
          bairro:    addr.neighborhood || addr.city || '',
          municipio: addr.city      || '',
          uf:        addr.state     || '',
          cep:       (addr.postcode || '').replace(/\D/g, ''),
        },
      }

      // Bug 1.3 — PIX à vista: omitir parcelas (evita erro de vencimento)
      const isPix = !order.payment_method || order.payment_method.toLowerCase().includes('pix') ||
        resolveFormaPagamento(extra, order.payment_method) === (Number(extra.fp_pix) || 1)
      const parcelas = isPix ? undefined : [{
        data:           dataHoje,
        valor:          parseFloat(order.total) || 0,
        formaPagamento: { id: resolveFormaPagamento(extra, order.payment_method) },
      }]

      // Bug 1.2 — NCM (classificacaoFiscal) obrigatório para SEFAZ
      // Default cerveja: 2203.00.00 — ajustar por produto se necessário
      const blingItensComNcm = blingItens.map((item: any) => ({
        ...item,
        classificacaoFiscal: extra.ncm_padrao || '2203.00.00',
      }))

      // POST sem wrapper { data: {} } — endpoint /nfe usa campos direto no root
      const nfePayload: any = {
        tipo:              1,
        serie:             Number(extra.nfe_serie) || 3,
        dataOperacao:      `${dataHoje} 00:00:00`,
        naturezaOperacao:  { id: Number(extra.natureza_operacao_id) },
        contato,
        itens: blingItensComNcm,
        transporte: { fretePorConta: 9 },
        informacoesAdicionais: {
          informacoesContribuinte: `Pedido WooCommerce #${order.number || order.id}`,
        },
      }
      if (parcelas) nfePayload.parcelas = parcelas

      let res = await fetch(`${BLING_BASE}/nfe`, {
        method: 'POST',
        headers: blingHeaders,
        body: JSON.stringify(nfePayload),
      })
      let result = await res.json()

      if (!res.ok && result?.error?.type === 'invalid_token') {
        const refreshed = await refreshBlingToken(supabase, company_id, extra)
        if (refreshed) {
          blingHeaders['Authorization'] = `Bearer ${refreshed}`
          res    = await fetch(`${BLING_BASE}/nfe`, { method: 'POST', headers: blingHeaders, body: JSON.stringify(nfePayload) })
          result = await res.json()
        }
      }

      if (!res.ok) {
        const desc = result?.error?.description || result?.error?.fields?.map((f: any) => f.msg).join(', ') || ''

        // NF-e duplicada — busca a existente e retorna como sucesso
        if (desc.toLowerCase().includes('existe uma nota fiscal') || desc.toLowerCase().includes('ja existe')) {
          try {
            const searchRes = await fetch(`${BLING_BASE}/nfe?limite=10&situacao=5`, { headers: blingHeaders })
            const searchData = await searchRes.json()
            const nfes: any[] = searchData?.data || []
            const found = nfes.find((n: any) => n.contato?.numeroDocumento?.replace(/\D/g, '') === cpf) || nfes[0]
            if (found?.id && found?.numero) {
              return new Response(JSON.stringify({
                id:       found.id,
                numero:   found.numero,
                situacao: 'Autorizada',
              }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
          } catch {}
        }

        const msg = desc || JSON.stringify(result)
        return new Response(JSON.stringify({
          error: msg,
          __debug: { cpf, contato, itensCount: blingItens.length, itens: blingItens, payload: nfePayload, blingRaw: result },
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

    // ── Download DANFE ────────────────────────────────────────────
    if (action === 'danfe') {
      if (!nfe_id) throw new Error('nfe_id obrigatório para download do DANFE')

      const fetchDanfe = async (id: string) => {
        const url = `${BLING_BASE}/nfe/${id}/danfe`
        const r = await fetch(url, { headers: blingHeaders, redirect: 'follow' })
        return r
      }

      let r = await fetchDanfe(nfe_id)
      let resolvedId = nfe_id

      // ID desatualizado (404) — busca pelo número ou CPF
      if (r.status === 404) {
        const busca     = await fetch(`${BLING_BASE}/nfe?situacao=5&limite=100`, { headers: blingHeaders })
        const buscaData = await busca.json()
        const nfes: any[] = buscaData?.data || []

        const cpfClean    = (nfe_cpf || '').replace(/\D/g, '')
        const numeroClean = nfe_number ? String(parseInt(String(nfe_number))) : null

        const found =
          (numeroClean
            ? nfes.find((n: any) => String(parseInt(String(n.numero || '0'))) === numeroClean)
            : null) ??
          (cpfClean
            ? nfes.find((n: any) => n.contato?.numeroDocumento?.replace(/\D/g, '') === cpfClean)
            : null) ??
          nfes[0]

        if (found?.id) {
          await new Promise(res => setTimeout(res, 400))
          r = await fetchDanfe(String(found.id))
          resolvedId = String(found.id)
        }
      }

      const status = r.status
      const finalUrl = r.url
      const ct = r.headers.get('content-type') || ''
      const extra2 = resolvedId !== nfe_id ? { new_nfe_id: resolvedId } : {}

      if (r.ok && finalUrl && finalUrl !== `${BLING_BASE}/nfe/${resolvedId}/danfe`) {
        return new Response(JSON.stringify({ url: finalUrl, ...extra2 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (r.ok && (ct.includes('pdf') || ct.includes('octet-stream'))) {
        const buf = await r.arrayBuffer()
        const bytes = new Uint8Array(buf)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
        return new Response(JSON.stringify({ pdf_base64: btoa(binary), ...extra2 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const bodyText = await r.text().catch(() => '')
      let d: any = {}
      try { d = JSON.parse(bodyText) } catch {}
      const urlFromJson = d?.data?.url || d?.url
      if (urlFromJson) return new Response(JSON.stringify({ url: urlFromJson, ...extra2 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      const blingMsg = d?.error?.description || d?.error?.message || null
      const userError =
        status === 404 ? 'NF-e não encontrada no Bling. A nota pode ainda não ter sido emitida, ou o ID está desatualizado.' :
        status === 401 || status === 403 ? 'Token do Bling sem permissão para baixar o DANFE. Verifique as credenciais em Integrações → Bling.' :
        status >= 500 ? 'Erro interno do Bling ao gerar o DANFE. Tente novamente em instantes.' :
        blingMsg ? `Bling: ${blingMsg}` :
        `Não foi possível baixar o DANFE (código ${status}).`
      return new Response(JSON.stringify({ error: userError }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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
