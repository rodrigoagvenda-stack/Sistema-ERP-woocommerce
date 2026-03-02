import { useState, useEffect } from 'react'
import { RefreshCw, DollarSign, ShoppingCart, TrendingUp, Package, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { wooProxy } from '@/lib/api'

function StatCard({ title, value, icon: Icon, sub }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
          <div className="p-2.5 rounded-lg bg-[#f4b522]/10">
            <Icon className="w-5 h-5 text-[#f4b522]" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsOverview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
  const fmtN = (n) => new Intl.NumberFormat('pt-BR').format(n || 0)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const after = start.toISOString()
      const before = now.toISOString()

      const orders = await wooProxy({
        endpoint: `orders?status=completed,processing&after=${after}&before=${before}&per_page=100`,
      })

      const arr = Array.isArray(orders) ? orders : []
      const total_sales = arr.reduce((s, o) => s + parseFloat(o.total || 0), 0)
      const total_orders = arr.length
      const total_items = arr.reduce((s, o) => s + (o.line_items?.reduce((a, i) => a + i.quantity, 0) || 0), 0)
      const total_shipping = arr.reduce((s, o) => s + parseFloat(o.shipping_total || 0), 0)
      const total_discount = arr.reduce((s, o) => s + parseFloat(o.discount_total || 0), 0)
      const gross_sales = total_sales + total_discount
      const average_total_sales = total_orders > 0 ? total_sales / total_orders : 0
      const days = Math.max(1, Math.ceil((now - start) / 86400000))
      const average_sales = total_sales / days

      setData({ total_sales, total_orders, total_items, average_total_sales, total_shipping, total_discount, gross_sales, total_refunds: 0, average_sales })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Visão Geral</h1>
          <p className="text-sm text-gray-500">Analytics do mês atual — dados em tempo real do WooCommerce</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Erro ao carregar dados: {error}. Configure o WooCommerce em Configurações.</AlertDescription>
        </Alert>
      )}

      {loading && !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Card key={i}><CardContent className="pt-6"><div className="h-16 bg-gray-100 rounded animate-pulse" /></CardContent></Card>)}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Receita Total" value={fmt(data.total_sales)} icon={DollarSign} sub="No mês atual" />
            <StatCard title="Pedidos" value={fmtN(data.total_orders)} icon={ShoppingCart} sub={`${fmtN(data.average_sales)} médio/dia`} />
            <StatCard title="Ticket Médio" value={fmt(data.average_total_sales)} icon={TrendingUp} />
            <StatCard title="Produtos Vendidos" value={fmtN(data.total_items)} icon={Package} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Receita Bruta</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{fmt(data.gross_sales)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Reembolsos</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-red-500">{fmt(data.total_refunds)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Descontos</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-orange-500">{fmt(data.total_discount)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Frete</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{fmt(data.total_shipping)}</p></CardContent>
            </Card>
          </div>
        </>
      ) : !error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-400 text-sm">Configure o WooCommerce para visualizar analytics</p>
            <a href="/admin/woo/settings" className="text-[#f4b522] text-sm mt-2 inline-block hover:underline">Ir para Configurações →</a>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
