import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tag, Layers, Star, BarChart2,
  Settings, ChevronDown, ChevronRight, LogOut, Menu, X,
  ShoppingBag, TrendingUp, ShoppingCart, Shuffle, FolderOpen,
  Warehouse, SlidersHorizontal, Globe, FileText, Bookmark
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const LOGO_URL = 'https://hnkhihzeqtzqzybkjype.supabase.co/storage/v1/object/public/Logos-site/geezer_preto.png'

const navItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/admin/dashboard',
  },
  {
    label: 'Produtos',
    icon: Package,
    children: [
      { label: 'Produtos', icon: ShoppingBag, to: '/admin/products' },
      { label: 'Categorias', icon: FolderOpen, to: '/admin/categories' },
      { label: 'Marcas', icon: Bookmark, to: '/admin/brands' },
      { label: 'Tags', icon: Tag, to: '/admin/tags' },
      { label: 'Atributos', icon: Layers, to: '/admin/attributes' },
      { label: 'Avaliações', icon: Star, to: '/admin/reviews' },
    ],
  },
  {
    label: 'Analytics',
    icon: BarChart2,
    children: [
      { label: 'Visão Geral', icon: TrendingUp, to: '/admin/analytics/overview' },
      { label: 'Produtos', icon: ShoppingBag, to: '/admin/analytics/products' },
      { label: 'Receita', icon: TrendingUp, to: '/admin/analytics/revenue' },
      { label: 'Pedidos', icon: ShoppingCart, to: '/admin/analytics/orders' },
      { label: 'Variações', icon: Shuffle, to: '/admin/analytics/variations' },
      { label: 'Categorias', icon: FolderOpen, to: '/admin/analytics/categories' },
      { label: 'Estoque', icon: Warehouse, to: '/admin/analytics/stock' },
      { label: 'Configurações', icon: SlidersHorizontal, to: '/admin/analytics/settings' },
    ],
  },
  {
    label: 'WooCommerce',
    icon: Globe,
    children: [
      { label: 'Configurações', icon: Settings, to: '/admin/woo/settings' },
      { label: 'Logs de Sync', icon: FileText, to: '/admin/woo/logs' },
    ],
  },
  {
    label: 'FAQ',
    icon: FileText,
    to: '/admin/faq',
  },
]

function NavItem({ item, collapsed, onNavigate }) {
  const [open, setOpen] = useState(false)

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900',
            collapsed && 'justify-center px-2'
          )}
        >
          <item.icon className="w-4 h-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </>
          )}
        </button>
        {open && !collapsed && (
          <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-3">
            {item.children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-[#f4b522]/15 text-[#c49018] font-medium'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  )
                }
              >
                <child.icon className="w-3.5 h-3.5" />
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-[#f4b522] text-[#1a1a1a]'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
          collapsed && 'justify-center px-2'
        )
      }
    >
      <item.icon className="w-4 h-4 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  )
}

function Sidebar({ collapsed, onNavigate }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-4 border-b border-gray-100', collapsed && 'justify-center px-3')}>
        {collapsed ? (
          <div className="w-8 h-8 bg-[#f4b522] rounded-lg flex items-center justify-center shrink-0">
            <span className="text-[#1a1a1a] font-bold text-sm">G</span>
          </div>
        ) : (
          <img
            src={LOGO_URL}
            alt="Geezer"
            className="h-11 w-auto object-contain"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        )}
        {!collapsed && (
          <div className="hidden w-8 h-8 bg-[#f4b522] rounded-lg items-center justify-center shrink-0">
            <span className="text-[#1a1a1a] font-bold text-sm">G</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-hide">
        {navItems.map((item) => (
          <NavItem key={item.label} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      <Separator />

      {/* User footer */}
      <div className={cn('p-3 flex items-center gap-3', collapsed && 'justify-center')}>
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback className="text-xs">AD</AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">Admin</p>
            <p className="text-xs text-gray-400 truncate">Geezer ERP</p>
          </div>
        )}
        {!collapsed && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5 text-gray-400" />
          </Button>
        )}
      </div>

    </div>
  )
}

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#f3f4f8] flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop (always visible, collapsible) */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full transition-all duration-200 z-30',
          'hidden md:block',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <Sidebar collapsed={collapsed} onNavigate={undefined} />
      </aside>

      {/* Sidebar — mobile (drawer overlay) */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 z-50 transition-transform duration-200 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Main content */}
      <div
        className={cn(
          'flex-1 flex flex-col min-h-screen transition-all duration-200',
          'md:ml-60',
          collapsed && 'md:ml-16'
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center gap-4">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Desktop collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden md:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>

          {/* Mobile logo */}
          <div className="md:hidden flex-1 flex items-center">
            <img
              src={LOGO_URL}
              alt="Geezer"
              className="h-7 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>

          <div className="flex-1 hidden md:block" />

          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-gray-500 hover:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>

      </div>
    </div>
  )
}
