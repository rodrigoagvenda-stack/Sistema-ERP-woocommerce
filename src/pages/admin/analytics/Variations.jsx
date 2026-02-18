import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { wooProxy } from '@/lib/api'

const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

export default function Variations() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState({})
  const [variations, setVariations] = useState({})
  const [loadingVars, setLoadingVars] = useState({})

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await wooProxy({ endpoint: 'products?type=variable&per_page=50&status=publish' })
      setProducts(Array.isArray(data) ? data : [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const loadVariations = async (productId) => {
    if (variations[productId]) {
      setExpanded(prev => ({ ...prev, [productId]: !prev[productId] }))
      return
    }
    setLoadingVars(prev => ({ ...prev, [productId]: true }))
    try {
      const data = await wooProxy({ endpoint: `products/${productId}/variations?per_page=50` })
      setVariations(prev => ({ ...prev, [productId]: Array.isArray(data) ? data : [] }))
      setExpanded(prev => ({ ...prev, [productId]: true }))
    } catch (e) { setError('Erro ao carregar variações: ' + e.message) }
    finally { setLoadingVars(prev => ({ ...prev, [productId]: false })) }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Variações</h1>
          <p className="text-sm text-gray-500">Produtos variáveis e suas variações</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      {loading ? (
        <Card><CardContent className="p-8 text-center text-gray-400 text-sm">Carregando...</CardContent></Card>
      ) : products.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-400 text-sm">{error ? 'Erro ao carregar' : 'Nenhum produto variável encontrado'}</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {products.map(p => (
            <Card key={p.id}>
              <CardContent className="p-0">
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => loadVariations(p.id)} className="text-gray-400 hover:text-gray-600">
                    {loadingVars[p.id] ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    ) : expanded[p.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <div className="flex-1">
                    <span className="font-medium text-sm">{p.name}</span>
                    <span className="text-xs text-gray-400 ml-2">ID: {p.id}</span>
                  </div>
                  <Badge variant="info">{p.variations?.length || 0} variações</Badge>
                  <span className="text-sm font-medium">{fmt(p.price)}</span>
                  <Badge variant={p.stock_status === 'instock' ? 'success' : 'warning'}>
                    {p.stock_status === 'instock' ? 'Em estoque' : 'Esgotado'}
                  </Badge>
                </div>

                {expanded[p.id] && variations[p.id] && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2">
                    {variations[p.id].length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">Nenhuma variação</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs h-8">Variação</TableHead>
                            <TableHead className="text-xs h-8">SKU</TableHead>
                            <TableHead className="text-xs h-8">Preço</TableHead>
                            <TableHead className="text-xs h-8">Estoque</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {variations[p.id].map(v => (
                            <TableRow key={v.id}>
                              <TableCell className="text-xs py-2">
                                {v.attributes?.map(a => a.option).join(' / ') || `#${v.id}`}
                              </TableCell>
                              <TableCell className="text-xs text-gray-400 py-2">{v.sku || '—'}</TableCell>
                              <TableCell className="text-xs py-2">{fmt(v.price)}</TableCell>
                              <TableCell className="py-2">
                                <Badge variant={v.stock_status === 'instock' ? 'success' : 'warning'} className="text-xs">
                                  {v.manage_stock ? v.stock_quantity : (v.stock_status === 'instock' ? 'Disponível' : 'Esgotado')}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
