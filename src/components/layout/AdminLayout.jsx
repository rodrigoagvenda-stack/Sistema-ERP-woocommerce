import { useMemo, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tag, Layers, Star, BarChart2,
  Settings, ChevronDown, ChevronRight, LogOut, Menu, X,
  ShoppingBag, TrendingUp, ShoppingCart, Shuffle, FolderOpen,
  Warehouse, SlidersHorizontal, Globe, FileText, Bookmark, Ticket, Beer, Truck, CreditCard
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCompany } from '@/context/CompanyContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

function NavItem({ item, collapsed, onNavigate, brandColor }) {
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
                      ? 'font-medium'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  )
                }
                style={({ isActive }) => isActive
                  ? { backgroundColor: `${brandColor}18`, color: brandColor }
                  : {}
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
          isActive ? 'text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
          collapsed && 'justify-center px-2'
        )
      }
      style={({ isActive }) => isActive ? { backgroundColor: brandColor } : {}}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  )
}

function Sidebar({ collapsed, onNavigate, brandColor, logoUrl, navItems, slug }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate(`/login/${slug}`)
  }

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-4 border-b border-gray-100', collapsed && 'justify-center px-3')}>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className={cn('object-contain', collapsed ? 'h-8 w-8 rounded-lg' : 'h-11 w-auto')} />
        ) : (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: brandColor }}>
            <span className="text-white font-bold text-sm">{slug?.[0]?.toUpperCase() || '?'}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-hide">
        {navItems.map((item) => (
          <NavItem
            key={item.label}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
            brandColor={brandColor}
          />
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
            <p className="text-xs text-gray-400 truncate">Painel</p>
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
  const { company, features } = useCompany()
  const { slug } = useParams()

  const brandColor = company?.primary_color || '#15A344'
  const logoUrl    = company?.logo_url || null
  const base       = `/admin/${slug}`

  const navItems = useMemo(() => {
    const wooChildren = [
      { label: 'Configurações',       icon: Settings,          to: `${base}/woo/settings` },
      ...(features.payments ? [{ label: 'Formas de Pagamento', icon: CreditCard, to: `${base}/woo/payments` }] : []),
      ...(features.shipping ? [{ label: 'Frete',               icon: Truck,      to: `${base}/woo/shipping` }] : []),
      { label: 'Logs de Sync',        icon: FileText,          to: `${base}/woo/logs` },
    ]

    return [
      { label: 'Dashboard', icon: LayoutDashboard, to: `${base}/dashboard` },
      {
        label: 'Produtos',
        icon: Package,
        children: [
          { label: 'Produtos',    icon: ShoppingBag, to: `${base}/products` },
          { label: 'Categorias', icon: FolderOpen,  to: `${base}/categories` },
          { label: 'Marcas',     icon: Bookmark,    to: `${base}/brands` },
          { label: 'Tags',       icon: Tag,         to: `${base}/tags` },
          { label: 'Atributos',  icon: Layers,      to: `${base}/attributes` },
          { label: 'Avaliações', icon: Star,        to: `${base}/reviews` },
        ],
      },
      {
        label: 'Analytics',
        icon: BarChart2,
        children: [
          { label: 'Visão Geral',  icon: TrendingUp,        to: `${base}/analytics/overview` },
          { label: 'Produtos',     icon: ShoppingBag,       to: `${base}/analytics/products` },
          { label: 'Receita',      icon: TrendingUp,        to: `${base}/analytics/revenue` },
          { label: 'Pedidos',      icon: ShoppingCart,      to: `${base}/analytics/orders` },
          { label: 'Variações',    icon: Shuffle,           to: `${base}/analytics/variations` },
          { label: 'Categorias',   icon: FolderOpen,        to: `${base}/analytics/categories` },
          { label: 'Estoque',      icon: Warehouse,         to: `${base}/analytics/stock` },
          { label: 'Configurações',icon: SlidersHorizontal, to: `${base}/analytics/settings` },
        ],
      },
      { label: 'WooCommerce', icon: Globe, children: wooChildren },
      ...(features.coupons ? [{ label: 'Cupons', icon: Ticket, to: `${base}/coupons` }] : []),
      ...(features.site ? [{
        label: 'Site',
        icon: Globe,
        children: [{ label: 'Nossas Cervejas', icon: Beer, to: `${base}/nossas-cervejas` }],
      }] : []),
      { label: 'FAQ', icon: FileText, to: `${base}/faq` },
    ]
  }, [features, base])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate(`/login/${slug}`)
  }

  return (
    <div className="min-h-screen bg-[#f3f4f8] flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — desktop */}
      <aside className={cn('fixed top-0 left-0 h-full transition-all duration-200 z-30 hidden md:block', collapsed ? 'w-16' : 'w-60')}>
        <Sidebar collapsed={collapsed} onNavigate={undefined} brandColor={brandColor} logoUrl={logoUrl} navItems={navItems} slug={slug} />
      </aside>

      {/* Sidebar — mobile */}
      <aside className={cn('fixed top-0 left-0 h-full w-64 z-50 transition-transform duration-200 md:hidden', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <Sidebar collapsed={false} onNavigate={() => setMobileOpen(false)} brandColor={brandColor} logoUrl={logoUrl} navItems={navItems} slug={slug} />
      </aside>

      {/* Main content */}
      <div className={cn('flex-1 flex flex-col min-h-screen transition-all duration-200 md:ml-60', collapsed && 'md:ml-16')}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            <Menu className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hidden md:flex" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
          <div className="md:hidden flex-1 flex items-center">
            {logoUrl && <img src={logoUrl} alt="Logo" className="h-7 w-auto object-contain" />}
          </div>
          <div className="flex-1 hidden md:block" />
          <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-red-600" onClick={handleLogout}>
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
