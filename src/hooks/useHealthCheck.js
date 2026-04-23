import { useState, useEffect, useRef, useCallback } from 'react'
import { ENV } from '@/config/env'
import { wooProxy } from '@/lib/api'
import { useCompany } from '@/context/CompanyContext'

const INTERVAL = 30_000
const TIMEOUT  = 6_000

async function pingSupabase() {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT)
    const res = await fetch(`${ENV.SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: ENV.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${ENV.SUPABASE_ANON_KEY}`,
      },
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    return res.ok || res.status === 401
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
