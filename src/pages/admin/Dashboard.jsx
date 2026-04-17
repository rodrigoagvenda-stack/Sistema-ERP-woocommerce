import { useState, useEffect } from 'react'
import { Package, FolderOpen, Bookmark, Tag, TrendingDown, DollarSign, ShoppingBag, BarChart2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'

function StatCard({ title, value, icon: Icon, sub, color = '[color:var(--brand)]' }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
          </div>
          <div className="p-2.5 rounded-lg [background-color:color-mix(in_srgb,var(--brand)_10%,transparent)]">
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><div className="h-16 bg-gray-100 rounded animate-pulse" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  const formatted = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral do sistema Geezer</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Produtos"
          value={stats?.totalProducts ?? 0}
          icon={ShoppingBag}
          sub={`${stats?.activeProducts ?? 0} ativos`}
        />
        <StatCard
          title="Categorias"
          value={stats?.totalCategories ?? 0}
          icon={FolderOpen}
        />
        <StatCard
          title="Marcas"
          value={stats?.totalBrands ?? 0}
          icon={Bookmark}
        />
        <StatCard
          title="Tags"
          value={stats?.totalTags ?? 0}
          icon={Tag}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard
          title="Valor em Estoque"
          value={formatted(stats?.totalValue ?? 0)}
          icon={DollarSign}
          sub="Produtos × preço × estoque"
        />
        <StatCard
          title="Estoque Baixo"
          value={stats?.lowStock ?? 0}
          icon={TrendingDown}
          sub="Produtos com menos de 5 unidades"
          color={stats?.lowStock > 0 ? 'text-red-500' : '[color:var(--brand)]'}
        />
        <StatCard
          title="Analytics WooCommerce"
          value={<a href="/admin/analytics/overview" className="[color:var(--brand)] hover:underline text-base">Ver Analytics →</a>}
          icon={BarChart2}
          sub="Receita, pedidos e estoque em tempo real"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Acesso rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Novo Produto', href: '/admin/products' },
              { label: 'Nova Categoria', href: '/admin/categories' },
              { label: 'Nova Marca', href: '/admin/brands' },
              { label: 'Analytics', href: '/admin/analytics/overview' },
            ].map(item => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#f3f4f8] hover:[background-color:color-mix(in_srgb,var(--brand)_10%,transparent)] text-sm font-medium text-gray-700 hover:[color:var(--brand)] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
