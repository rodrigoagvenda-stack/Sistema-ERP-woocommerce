import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { method = 'GET', endpoint, body, credentials } = await req.json()

    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'endpoint é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Usar credenciais do body (teste) ou buscar do banco
    let creds = credentials
    if (!creds) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data, error: credsError } = await supabase
        .from('marketplace_credentials')
        .select('store_url, consumer_key, consumer_secret')
        .eq('marketplace', 'woocommerce')
        .single()

      if (credsError || !data || !data.store_url || !data.consumer_key) {
        return new Response(JSON.stringify({ error: 'WooCommerce não configurado. Acesse WooCommerce → Configurações no ERP.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      creds = data
    }

    // Normalizar URL da loja
    let storeUrl = creds.store_url.trim().replace(/\/+$/, '')
    if (!storeUrl.startsWith('http')) {
      storeUrl = 'https://' + storeUrl
    }

    // Montar URL completa com autenticação via query params
    const separator = endpoint.includes('?') ? '&' : '?'
    const fullUrl = `${storeUrl}/wp-json/wc/v3/${endpoint}${separator}consumer_key=${encodeURIComponent(creds.consumer_key)}&consumer_secret=${encodeURIComponent(creds.consumer_secret)}`

    // Fazer requisição para WooCommerce
    const fetchOptions: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    }

    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      fetchOptions.body = JSON.stringify(body)
    }

    const response = await fetch(fullUrl, fetchOptions)
    const responseText = await response.text()

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { raw: responseText }
    }

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: `WooCommerce API error ${response.status}`,
        details: responseData
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
