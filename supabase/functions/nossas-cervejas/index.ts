import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const apiHeaders = {
      'apikey': serviceKey,
      'Authorization': 'Bearer ' + serviceKey,
      'Content-Type': 'application/json',
    }

    const configRes = await fetch(
      supabaseUrl + '/rest/v1/nossas_cervejas_config?select=*&limit=1',
      { headers: apiHeaders }
    )
    const itemsRes = await fetch(
      supabaseUrl + '/rest/v1/nossas_cervejas_items?select=*&order=sort_order.asc',
      { headers: apiHeaders }
    )

    const configArr = await configRes.json()
    const items = await itemsRes.json()

    const config = Array.isArray(configArr) && configArr.length > 0
      ? configArr[0]
      : { page_title: 'Nossas Cervejas', page_description: '' }

    return new Response(
      JSON.stringify({ config: config, items: Array.isArray(items) ? items : [] }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
