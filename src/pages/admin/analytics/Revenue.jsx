import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { wooProxy } from '@/lib/api'

const PERIODS = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
  { label: '1 ano', days: 365 },
]

const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

export default function Revenue() {
  const [period, setPeriod] = useState('30')
  const [data, setData] = useState([])
  const [totals, setTotals] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const days = parseInt(period)
      const end = new Date()
      const start = new Date(end - days * 86400000)
      const dateMin = start.toISOString().split('T')[0]
      const dateMax = end.toISOString().split('T')[0]
      const sales = await wooProxy({ endpoint: `reports/sales?date_min=${dateMin}&date_max=${dateMax}` })
      setTotals(sales)
      // Build chart data from totals (WooCommerce reports/sales returns aggregate)
      // For chart, we get the aggregate per day using period=day
      const chartData = Array.isArray(sales) ? sales : (sales.totals ? Object.entries(sales.totals).map(([date, d]) => ({
        date, sales: parseFloat(d.sales || 0), orders: parseInt(d.orders || 0)
      })) : [])
      setData(chartData)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [period])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Receita</h1>
          <p className="text-sm text-gray-500">Evolução de receita por período</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              {PERIODS.map(p => <TabsTrigger key={p.days} value={p.days.toString()}>{p.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {totals && !Array.isArray(totals) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Receita Total', value: fmt(totals.total_sales) },
            { label: 'Receita Bruta', value: fmt(totals.gross_sales) },
            { label: 'Pedidos', value: totals.total_orders },
            { label: 'Ticket Médio', value: fmt(totals.average_total_sales) },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-5">
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-xl font-bold mt-1">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Receita por Dia</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Carregando...</div>
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(1)}k`} />
                <Tooltip formatter={(v) => [fmt(v), 'Receita']} labelFormatter={l => `Data: ${l}`} />
                <Line type="monotone" dataKey="sales" stroke="#f4b522" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              {error ? 'Erro ao carregar gráfico' : 'Dados insuficientes para o gráfico no período selecionado'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
