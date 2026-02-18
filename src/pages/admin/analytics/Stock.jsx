import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, Package, AlertTriangle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { wooProxy, api } from '@/lib/api'

const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

export default function Stock() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [threshold, setThreshold] = useState(5)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [wooData, settings] = await Promise.all([
        wooProxy({ endpoint: 'products?per_page=100&status=publish&manage_stock=true' }),
        api.getAnalyticsSettings()
      ])
      setProducts(Array.isArray(wooData) ? wooData : [])
      setThreshold(settings.low_stock_threshold || 5)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const inStock = products.filter(p => p.manage_stock && p.stock_quantity > threshold)
  const lowStock = products.filter(p => p.manage_stock && p.stock_quantity > 0 && p.stock_quantity <= threshold)
  const outOfStock = products.filter(p => p.manage_stock && p.stock_quantity <= 0)
  const notManaged = products.filter(p => !p.manage_stock)

  function ProductTable({ items, emptyMsg }) {
    if (items.length === 0) return <div className="p-8 text-center text-gray-400 text-sm">{emptyMsg}</div>
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Estoque</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(p => (
            <TableRow key={p.id}>
              <TableCell className="font-medium text-sm">{p.name}</TableCell>
              <TableCell className="text-sm text-gray-400">{p.sku || '—'}</TableCell>
              <TableCell className="text-sm">{fmt(p.price)}</TableCell>
              <TableCell>
                <Badge variant={p.stock_quantity <= 0 ? 'destructive' : p.stock_quantity <= threshold ? 'warning' : 'success'}>
                  {p.stock_quantity ?? '—'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Estoque</h1>
          <p className="text-sm text-gray-500">Visão do estoque via WooCommerce (threshold: {threshold} unidades)</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100"><Package className="h-4 w-4 text-green-600" /></div>
              <div><p className="text-xs text-gray-500">Em estoque</p><p className="text-xl font-bold">{loading ? '...' : inStock.length}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100"><AlertTriangle className="h-4 w-4 text-yellow-600" /></div>
              <div><p className="text-xs text-gray-500">Estoque baixo</p><p className="text-xl font-bold text-yellow-600">{loading ? '...' : lowStock.length}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100"><XCircle className="h-4 w-4 text-red-600" /></div>
              <div><p className="text-xs text-gray-500">Zerados</p><p className="text-xl font-bold text-red-600">{loading ? '...' : outOfStock.length}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="low">
            <div className="px-4 pt-4">
              <TabsList>
                <TabsTrigger value="low">Estoque Baixo ({lowStock.length})</TabsTrigger>
                <TabsTrigger value="out">Zerados ({outOfStock.length})</TabsTrigger>
                <TabsTrigger value="all">Todos ({products.length})</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="low" className="mt-0">
              <ProductTable items={lowStock} emptyMsg="Nenhum produto com estoque baixo" />
            </TabsContent>
            <TabsContent value="out" className="mt-0">
              <ProductTable items={outOfStock} emptyMsg="Nenhum produto zerado" />
            </TabsContent>
            <TabsContent value="all" className="mt-0">
              <ProductTable items={products} emptyMsg={loading ? 'Carregando...' : 'Nenhum produto encontrado'} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
