import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function SuperAdminRoute({ children }) {
  const [status, setStatus] = useState('loading') // loading | allowed | denied

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setStatus('denied'); return }
      const { data } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', session.user.id)
        .single()
      setStatus(data?.is_super_admin ? 'allowed' : 'denied')
    })
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (status === 'denied') return <Navigate to="/login" replace />

  return children
}
