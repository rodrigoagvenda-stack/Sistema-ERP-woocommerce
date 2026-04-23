import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { wooProxy } from '@/lib/api'
import { useCompany } from '@/context/CompanyContext'

const INTERVAL = 30_000

async function pingSupabase() {
  try {
    const { error } = await supabase.from('companies').select('id').limit(1)
    // PGRST116 = nenhuma linha — banco ok. Outros erros de rede = offline
    if (error && error.message?.toLowerCase().includes('fetch')) return false
    return true
  } catch {
    return false
  }
}

async function pingWoo() {
  try {
    await wooProxy({ method: 'GET', endpoint: 'system_status' })
    return true
  } catch (e) {
    // Se o erro for da API do Woo (ex: credenciais), está online
    if (e.message && !e.message.includes('fetch') && !e.message.includes('network')) return true
    return false
  }
}

export function useHealthCheck() {
  const { company } = useCompany()
  const [down, setDown] = useState({ supabase: false, woo: false })
  const timerRef = useRef(null)

  const check = useCallback(async () => {
    const [sbOk, wooOk] = await Promise.all([
      pingSupabase(),
      company?.has_woocommerce ? pingWoo() : Promise.resolve(true),
    ])
    setDown({ supabase: !sbOk, woo: !wooOk })
  }, [company?.has_woocommerce])

  useEffect(() => {
    check()
    timerRef.current = setInterval(check, INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [check])

  const isDown = down.supabase || down.woo
  return { isDown, ...down }
}
