import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { wooProxy } from '@/lib/api'

const COLORS = ['#f4b522', '#fcd060', '#e8a41a', '#c98c0e', '#a87208', '#8a5e04', '#6b4a02', '#4d3600']

const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

export default function CategoriesAnalytics() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      // Fetch recent orders and compute category revenue
      const orders = await wooProxy({ endpoint: 'orders?per_page=100&status=completed&orderby=date&order=desc' })
      if (!Array.isArray(orders)) { setData([]); return }

      const catRevenue = {}
      for (const order of orders) {
        for (const item of (order.line_items || [])) {
          const catName = item.meta_data?.find(m => m.key === '_product_category')?.value || 'Sem categoria'
          catRevenue[catName] = (catRevenue[catName] || 0) + parseFloat(item.total || 0)
        }
      }

      const sorted = Object.entries(catRevenue)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
      setData(sorted)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Categorias</h1>
          <p className="text-sm text-gray-500">Receita por categoria (últimos 100 pedidos concluídos)</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Distribuição por Categoria</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Carregando...</div>
            ) : data.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Sem dados disponíveis</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Receita por Categoria</CardTitle></CardHeader>
          <CardContent className="p-0">
            {data.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">{loading ? 'Carregando...' : 'Sem dados'}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((d, i) => {
                    const total = data.reduce((s, x) => s + x.value, 0)
                    return (
                      <TableRow key={d.name}>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            {d.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">{fmt(d.value)}</TableCell>
                        <TableCell className="text-right text-sm text-gray-500">{((d.value / total) * 100).toFixed(1)}%</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
