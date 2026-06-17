import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { company_id, code } = await req.json()
    if (!company_id || !code) throw new Error('company_id e code são obrigatórios.')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Busca client_id e client_secret salvos
    const { data: creds } = await supabase
      .from('marketplace_credentials')
      .select('extra_data')
      .eq('marketplace', 'bling')
      .eq('company_id', company_id)
      .single()

    const clientId     = creds?.extra_data?.client_id
    const clientSecret = creds?.extra_data?.client_secret

    if (!clientId || !clientSecret) {
      throw new Error('Client ID e Client Secret não configurados. Salve as credenciais primeiro.')
    }

    // Troca o code pelo access token
    const credentials = btoa(`${clientId}:${clientSecret}`)
    const tokenRes = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
      }).toString(),
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(`Bling ${tokenRes.status}: ${JSON.stringify(tokenData)}`)
    }

    // Salva access_token e refresh_token
    await supabase
      .from('marketplace_credentials')
      .update({
        access_token: tokenData.access_token,
        extra_data: {
          ...creds.extra_data,
          refresh_token:    tokenData.refresh_token,
          token_expires_at: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString(),
        },
        is_active: true,
      })
      .eq('marketplace', 'bling')
      .eq('company_id', company_id)

    return new Response(JSON.stringify({ success: true, access_token: tokenData.access_token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    console.error('[BLING-OAUTH]', e.message)
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
