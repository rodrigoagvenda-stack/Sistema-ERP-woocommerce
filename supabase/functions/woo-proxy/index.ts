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
    const { method = 'GET', endpoint, body, credentials, action, image_url, filename, company_id } = await req.json()

    let creds = credentials
    if (!creds) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      if (!company_id) {
        return new Response(JSON.stringify({ error: 'company_id é obrigatório para buscar credenciais' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data, error: credsError } = await supabase
        .from('marketplace_credentials')
        .select('store_url, consumer_key, consumer_secret')
        .eq('marketplace', 'woocommerce')
        .eq('company_id', company_id)
        .eq('is_active', true)
        .limit(1)
        .single()

      if (credsError || !data) {
        return new Response(JSON.stringify({ error: 'WooCommerce não configurado ou inativo para esta empresa' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      creds = data
    }

    let storeUrl = creds.store_url.trim().replace(/\/+$/, '')
    if (!storeUrl.startsWith('http')) {
      storeUrl = 'https://' + storeUrl
    }

    // Ação especial: upload de imagem para a media library do WordPress
    if (action === 'upload_media') {
      if (!image_url) {
        return new Response(JSON.stringify({ error: 'image_url é obrigatório para upload_media' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const imgRes = await fetch(image_url)
      if (!imgRes.ok) throw new Error(`Falha ao baixar imagem: ${imgRes.status}`)
      const imgBlob = await imgRes.blob()

      const form = new FormData()
      form.append('file', imgBlob, filename || 'image.jpg')

      const basicAuth = btoa(`${creds.consumer_key}:${creds.consumer_secret}`)
      const mediaUrl = `${storeUrl}/wp-json/wp/v2/media`

      const mediaRes = await fetch(mediaUrl, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${basicAuth}` },
        body: form,
      })

      const mediaText = await mediaRes.text()
      let mediaData
      try { mediaData = JSON.parse(mediaText) } catch { mediaData = { raw: mediaText } }

      if (!mediaRes.ok) {
        return new Response(JSON.stringify({
          error: mediaData?.message || `WordPress Media API error ${mediaRes.status}`,
          details: mediaData,
          status_code: mediaRes.status,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      return new Response(JSON.stringify({ id: mediaData.id, src: mediaData.source_url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'endpoint é obrigatório' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
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
