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
    const { kit_id, company_id } = await req.json()
    log(`kit_id=${kit_id} company_id=${company_id}`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: kit } = await supabase
      .from('kits')
      .select('*')
      .eq('id', kit_id)
      .eq('company_id', company_id)
      .eq('active', true)
      .single()

    if (!kit) throw new Error('Kit não encontrado ou inativo.')
    log(`kit: ${kit.name} R$${kit.price}`)

    const { data: creds } = await supabase
      .from('marketplace_credentials')
      .select('access_token')
      .eq('marketplace', 'mercadopago')
      .eq('company_id', company_id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!creds?.access_token) throw new Error('Mercado Pago não configurado. Acesse Integrações → Mercado Pago.')

    const prefRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${creds.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{
          id:         kit.id,
          title:      kit.name,
          quantity:   1,
          unit_price: parseFloat(kit.price),
          currency_id: 'BRL',
        }],
        back_urls: {
          success: kit.success_url || '',
          failure: kit.failure_url || '',
          pending: kit.pending_url || '',
        },
        auto_return: kit.success_url ? 'approved' : 'all',
        external_reference: `kit_${kit.id}_${Date.now()}`,
      }),
    })

    const pref = await prefRes.json()
    log(`preference id=${pref.id} init_point=${pref.init_point}`)

    if (!prefRes.ok) throw new Error(pref.message || `Erro MP HTTP ${prefRes.status}`)

    return new Response(JSON.stringify({ url: pref.init_point, id: pref.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    console.error('[MP-PREF] ERRO:', e.message)
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
