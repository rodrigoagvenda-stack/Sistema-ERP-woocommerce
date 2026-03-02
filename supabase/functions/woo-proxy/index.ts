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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let creds = credentials
    if (!creds) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      const { data, error: credsError } = await supabase
        .from('marketplace_credentials')
        .select('store_url, consumer_key, consumer_secret')
        .eq('marketplace', 'woocommerce')
        .eq('is_active', true)
        .single()

      if (credsError || !data) {
        return new Response(JSON.stringify({ error: 'WooCommerce não configurado ou inativo' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      creds = data
    }

    let storeUrl = creds.store_url.trim().replace(/\/+$/, '')
    if (!storeUrl.startsWith('http')) {
      storeUrl = 'https://' + storeUrl
    }

    const separator = endpoint.includes('?') ? '&' : '?'
    const fullUrl = `${storeUrl}/wp-json/wc/v3/${endpoint}${separator}consumer_key=${encodeURIComponent(creds.consumer_key)}&consumer_secret=${encodeURIComponent(creds.consumer_secret)}`

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
      // Sempre retorna HTTP 200 — erro fica no campo "error" do body
      const debugUrl = fullUrl
        .replace(/consumer_key=[^&]+/, 'consumer_key=***')
        .replace(/consumer_secret=[^&]+/, 'consumer_secret=***')
      return new Response(JSON.stringify({
        error: responseData?.message || `WooCommerce API error ${response.status}`,
        details: responseData,
        debug_url: debugUrl,
        status_code: response.status,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
