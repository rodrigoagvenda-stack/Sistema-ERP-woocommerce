// Supabase Edge Function: registrar-venda-whatsapp
// Registra vendas realizadas via WhatsApp

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppSale {
  customer_name: string
  customer_phone: string
  customer_email?: string
  products: Array<{
    product_id: number
    quantity: number
    price: number
  }>
  total_amount: number
  payment_method?: string
  notes?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Parse request body
    const saleData: WhatsAppSale = await req.json()

    // Validate required fields
    if (!saleData.customer_name || !saleData.customer_phone) {
      return new Response(
        JSON.stringify({ error: 'Nome e telefone do cliente são obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!saleData.products || saleData.products.length === 0) {
      return new Response(
        JSON.stringify({ error: 'É necessário incluir pelo menos um produto' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create or find customer
    let customerId: number | null = null

    const { data: existingCustomer } = await supabaseClient
      .from('customers')
      .select('id')
      .eq('phone', saleData.customer_phone)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.id

      // Update customer info if provided
      await supabaseClient
        .from('customers')
        .update({
          name: saleData.customer_name,
          email: saleData.customer_email || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId)
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabaseClient
        .from('customers')
        .insert({
          name: saleData.customer_name,
          phone: saleData.customer_phone,
          email: saleData.customer_email || null,
          source: 'whatsapp',
          utm_source: saleData.utm_source || null,
          utm_medium: saleData.utm_medium || null,
          utm_campaign: saleData.utm_campaign || null,
        })
        .select('id')
        .single()

      if (customerError) {
        throw customerError
      }

      customerId = newCustomer.id
    }

    // Create sale record
    const { data: sale, error: saleError } = await supabaseClient
      .from('sales')
      .insert({
        customer_id: customerId,
        total_amount: saleData.total_amount,
        payment_method: saleData.payment_method || 'whatsapp',
        status: 'pending',
        source: 'whatsapp',
        notes: saleData.notes || null,
        utm_source: saleData.utm_source || null,
        utm_medium: saleData.utm_medium || null,
        utm_campaign: saleData.utm_campaign || null,
      })
      .select('id')
      .single()

    if (saleError) {
      throw saleError
    }

    const saleId = sale.id

    // Create sale items
    const saleItems = saleData.products.map(product => ({
      sale_id: saleId,
      product_id: product.product_id,
      quantity: product.quantity,
      unit_price: product.price,
      total_price: product.quantity * product.price,
    }))

    const { error: itemsError } = await supabaseClient
      .from('sale_items')
      .insert(saleItems)

    if (itemsError) {
      throw itemsError
    }

    // Update product stock
    for (const product of saleData.products) {
      await supabaseClient.rpc('decrease_product_stock', {
        p_product_id: product.product_id,
        p_quantity: product.quantity,
      })
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        sale_id: saleId,
        customer_id: customerId,
        message: 'Venda registrada com sucesso!',
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error registering sale:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao registrar venda',
        details: error,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
