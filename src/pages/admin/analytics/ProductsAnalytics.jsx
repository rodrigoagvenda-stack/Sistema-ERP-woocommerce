import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { wooProxy } from '@/lib/api'

const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

export default function ProductsAnalytics() {
  const [topSellers, setTopSellers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await wooProxy({ endpoint: 'products?orderby=popularity&order=desc&per_page=20&status=publish' })
      const arr = Array.isArray(data) ? data : []
      setTopSellers(arr.filter(p => p.total_sales > 0).map(p => ({ product_id: p.id, name: p.name, quantity: p.total_sales })))
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics de Produtos</h1>
          <p className="text-sm text-gray-500">Produtos mais vendidos no mês</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader><CardTitle className="text-sm">Top Vendidos — Mês Atual</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
          ) : topSellers.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">{error ? 'Erro ao carregar' : 'Sem dados. Configure o WooCommerce.'}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Qtd. Vendida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSellers.map((p, i) => (
                  <TableRow key={p.product_id}>
                    <TableCell>
                      <Badge variant={i < 3 ? 'default' : 'secondary'} className="w-7 h-7 flex items-center justify-center rounded-full p-0">
                        {i + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{p.name}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-[#c49018]">{p.quantity}</span>
                      <span className="text-gray-400 text-xs ml-1">unid.</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
