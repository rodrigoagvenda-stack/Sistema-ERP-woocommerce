import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Building2, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function SuperAdminLayout({ children }) {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Super Admin — Plataforma'
    const link = document.querySelector("link[rel~='icon']")
    if (link) link.href = '/favicon.ico'
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        {/* Header */}
        <div className="px-5 py-5 border-b border-gray-800">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Super Admin</p>
          <p className="text-sm font-semibold text-white mt-0.5">Plataforma</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <NavLink
            to="/super-admin/companies"
            className={({ isActive }) => cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive
                ? 'bg-white/10 text-white font-medium'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Building2 className="w-4 h-4" />
            Empresas
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
