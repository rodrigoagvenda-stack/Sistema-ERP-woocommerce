import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { method = 'GET', endpoint, body: reqBody, credentials } = await req.json()

    let storeUrl: string
    let consumerKey: string
    let consumerSecret: string

    if (credentials?.store_url) {
      storeUrl = credentials.store_url
      consumerKey = credentials.consumer_key
      consumerSecret = credentials.consumer_secret
    } else {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { data, error } = await supabase
        .from('marketplace_credentials')
        .select('store_url, consumer_key, consumer_secret')
        .eq('marketplace', 'woocommerce')
        .single()

      if (error || !data?.store_url) {
        return new Response(
          JSON.stringify({ error: 'Credenciais do WooCommerce nao configuradas. Acesse WooCommerce -> Configuracoes.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      storeUrl = data.store_url
      consumerKey = data.consumer_key
      consumerSecret = data.consumer_secret
    }

    const baseUrl = storeUrl.replace(/\/$/, '')
    const wooUrl = `${baseUrl}/wp-json/wc/v3/${endpoint}`
    const auth = btoa(`${consumerKey}:${consumerSecret}`)

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    }

    if (reqBody && method !== 'GET' && method !== 'DELETE') {
      fetchOptions.body = JSON.stringify(reqBody)
    }

    const wooRes = await fetch(wooUrl, fetchOptions)
    const wooData = await wooRes.json()

    if (!wooRes.ok) {
      return new Response(
        JSON.stringify({ error: wooData.message || `Erro WooCommerce: ${wooRes.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(wooData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
