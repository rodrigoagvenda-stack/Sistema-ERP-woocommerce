import { useState, useEffect } from 'react'
import { RefreshCw, Star, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { wooProxy } from '@/lib/api'
import Pagination, { paginate } from '@/components/Pagination'

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= rating ? 'text-[#f4b522] fill-[#f4b522]' : 'text-gray-200'}`} />
      ))}
    </div>
  )
}

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [filterRating, setFilterRating] = useState('')
  const [page, setPage] = useState(1)

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  const load = async () => {
    setLoading(true)
    setAlert(null)
    try {
      const params = new URLSearchParams({ per_page: '50', page: page.toString(), orderby: 'date', order: 'desc' })
      if (filterRating) params.set('rating', filterRating)
      const data = await wooProxy({ endpoint: `products/reviews?${params}` })
      setReviews(Array.isArray(data) ? data : [])
    } catch (e) {
      showAlert('error', 'Erro ao buscar avaliações: ' + e.message + '. Verifique as configurações do WooCommerce.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, filterRating])

  const fmt = (dateStr) => new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Avaliações</h1>
          <p className="text-sm text-gray-500">Dados em tempo real do WooCommerce (somente leitura)</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'success'}>
          {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Select value={filterRating || 'all'} onValueChange={v => { setFilterRating(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Todas as notas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as notas</SelectItem>
            {[5, 4, 3, 2, 1].map(r => (
              <SelectItem key={r} value={r.toString()}>{r} estrela{r !== 1 ? 's' : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Carregando avaliações do WooCommerce...</div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-gray-400 text-sm">Nenhuma avaliação encontrada</p>
              <p className="text-gray-300 text-xs">Configure o WooCommerce nas configurações para visualizar as avaliações</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Avaliador</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Comentário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginate(reviews, page).map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-medium text-gray-900">{r.product_name || `#${r.product_id}`}</TableCell>
                    <TableCell className="text-sm text-gray-600">{r.reviewer}</TableCell>
                    <TableCell><StarRating rating={r.rating} /></TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-gray-600 truncate" title={r.review?.replace(/<[^>]+>/g, '')}>{r.review?.replace(/<[^>]+>/g, '') || '—'}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'approved' ? 'success' : r.status === 'spam' ? 'destructive' : 'secondary'}>
                        {r.status === 'approved' ? 'Aprovado' : r.status === 'hold' ? 'Pendente' : r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{fmt(r.date_created)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {reviews.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{reviews.length} avaliações carregadas</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>Anterior</Button>
            <span className="flex items-center px-3 text-gray-600">Página {page}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={reviews.length < 50 || loading}>Próxima</Button>
          </div>
        </div>
      )}
    </div>
  )
}
