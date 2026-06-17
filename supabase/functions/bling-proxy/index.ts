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

async function blingGet(url: string, headers: Record<string, string>) {
  const r = await fetch(url, { headers })
  return r.json()
}

async function resolveContatoId(cpf: string, nome: string, billing: any, shipping: any, headers: Record<string, string>): Promise<number> {
  // Tenta achar contato existente pelo CPF/CNPJ
  const search = await blingGet(`${BLING_BASE}/contatos?cpf_cnpj=${cpf}&limite=1`, headers)
  const existing = search?.data?.[0]
  if (existing?.id) return existing.id

  // Cria o contato
  const body = {
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
  }
  const create = await fetch(`${BLING_BASE}/contatos`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data: body }),
  })
  const created = await create.json()
  if (!created?.data?.id) throw new Error(`Erro ao criar contato Bling: ${JSON.stringify(created)}`)
  return created.data.id
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

    const token = creds.access_token
    const extra = creds.extra_data || {}

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

      // Busca ou cria o contato no Bling e pega o ID
      const contatoId = await resolveContatoId(cpf, nome, billing, shipping, blingHeaders)

      const itens = (order.line_items || []).map((item: any) => ({
        codigo:    String(item.sku || item.product_id || ''),
        descricao: item.name,
        unidade:   'UN',
        quantidade: Number(item.quantity) || 1,
        valor:     parseFloat(item.price) || (parseFloat(item.subtotal) / (Number(item.quantity) || 1)) || 0,
        tipo:      'P',
        origem:    0,
      }))

      if (itens.length === 0) throw new Error('Pedido sem itens — não é possível emitir NF-e.')

      const nfePayload = {
        tipo: 1,
        dataOperacao: dataHoje,
        contato: { id: contatoId },
        itens,
        parcelas: [{
          data:  dataHoje,
          valor: parseFloat(order.total) || 0,
          formaPagamento: { id: resolveFormaPagamento(extra, order.payment_method) },
        }],
        transporte: {
          fretePorConta: 9,
          volumes: [],
        },
        observacoes: `Pedido WooCommerce #${order.number || order.id}`,
      }

      const res = await fetch(`${BLING_BASE}/nfe`, {
        method: 'POST',
        headers: blingHeaders,
        body: JSON.stringify({ data: nfePayload }),
      })
      const result = await res.json()

      if (!res.ok) {
        const msg = result?.error?.fields?.map((f: any) => f.msg).join(', ') || result?.error?.description || JSON.stringify(result)
        return new Response(JSON.stringify({
          error: msg,
          __debug: { cpf, contatoId, itensCount: itens.length, dataHoje, payload: nfePayload, blingRaw: result },
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

    if (!res.ok) {
      throw new Error(result?.error?.description || 'Erro Bling')
    }

    return new Response(JSON.stringify(result?.data || result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
