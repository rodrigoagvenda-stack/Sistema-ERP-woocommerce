import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCompany, clearCompany, updateCompanyCache } from '@/lib/company'

const CompanyContext = createContext(null)

function applyBranding(company) {
  if (!company) return
  const color = company.primary_color || '#15A344'
  document.documentElement.style.setProperty('--brand', color)
  if (company.favicon_url) {
    let link = document.querySelector("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = company.favicon_url
  }
  if (company.name) document.title = company.name
}

export function CompanyProvider({ children }) {
  const [company, setCompanyState] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const c = await getCompany()
      setCompanyState(c)
      applyBranding(c)
    } catch {
      setCompanyState(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') load()
      if (event === 'SIGNED_OUT') { clearCompany(); setCompanyState(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const setCompany = (updated) => {
    updateCompanyCache(updated)
    setCompanyState(prev => ({ ...prev, ...updated }))
    applyBranding({ ...company, ...updated })
  }

  const features = {
    payments: company?.feature_payments ?? true,
    shipping: company?.feature_shipping ?? true,
    coupons:  company?.feature_coupons  ?? true,
    site:     company?.feature_site     ?? true,
  }

  return (
    <CompanyContext.Provider value={{ company, loading, setCompany, features }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  return useContext(CompanyContext)
}
