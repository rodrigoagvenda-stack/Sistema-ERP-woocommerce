import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, company_id, email, password, user_id, nome } = await req.json()

    // Admin client com service role (acesso total ao auth)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ── Listar usuários da empresa ─────────────────────────────────────────────
    if (action === 'list') {
      const { data: profiles, error } = await admin
        .from('profiles')
        .select('id, email, created_at')
        .eq('company_id', company_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return new Response(JSON.stringify({ users: profiles || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Criar usuário ──────────────────────────────────────────────────────────
    if (action === 'create') {
      if (!email || !password || !company_id) {
        throw new Error('email, password e company_id são obrigatórios')
      }

      // Cria o usuário no Supabase Auth
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (authError) throw authError

      const userId = authData.user.id

      // Vincula à empresa na tabela profiles (inclui email para listagem)
      const nomeValue = nome?.trim() || email.split('@')[0]
      const { error: profileError } = await admin
        .from('profiles')
        .insert({ id: userId, company_id, email, nome: nomeValue })

      if (profileError) {
        // Rollback: remove o usuário do auth se o profile falhar
        await admin.auth.admin.deleteUser(userId)
        throw profileError
      }

      return new Response(
        JSON.stringify({ user: { id: userId, email, company_id } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Deletar usuário ────────────────────────────────────────────────────────
    if (action === 'delete') {
      if (!user_id) throw new Error('user_id é obrigatório')

      await admin.from('profiles').delete().eq('id', user_id)
      const { error } = await admin.auth.admin.deleteUser(user_id)
      if (error) throw error

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error(`Ação desconhecida: ${action}`)
  } catch (e) {
    console.error('[manage-company-users] erro:', e.message)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
