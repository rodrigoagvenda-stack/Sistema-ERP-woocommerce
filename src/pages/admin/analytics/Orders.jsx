import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { wooProxy } from '@/lib/api'

const getBrand = () => getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#6366f1'

const STATUS_LABELS = {
  pending:    { label: 'Pendente',     variant: 'warning' },
  processing: { label: 'Processando',  variant: 'info' },
  'on-hold':  { label: 'Em espera',    variant: 'secondary' },
  completed:  { label: 'Concluído',    variant: 'success' },
  cancelled:  { label: 'Cancelado',    variant: 'destructive' },
  refunded:   { label: 'Reembolsado',  variant: 'secondary' },
  failed:     { label: 'Falhou',       variant: 'destructive' },
}

const CANCELLABLE = ['pending', 'processing', 'on-hold']

const fmt     = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR')

export default function Orders() {
  const [orders,    setOrders]    = useState([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [page,      setPage]      = useState(1)
  const [cancelling, setCancelling] = useState(null)   // order being confirmed
  const [cancelBusy, setCancelBusy] = useState(false)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await wooProxy({ endpoint: `orders?per_page=20&page=${page}&orderby=date&order=desc` })
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [page])

  const handleCancel = async () => {
    if (!cancelling) return
    setCancelBusy(true)
    try {
      await wooProxy({ method: 'PUT', endpoint: `orders/${cancelling.id}`, body: { status: 'cancelled' } })
      setOrders(prev => prev.map(o => o.id === cancelling.id ? { ...o, status: 'cancelled' } : o))
      setCancelling(null)
    } catch (e) {
      alert('Erro ao cancelar: ' + e.message)
    } finally {
      setCancelBusy(false)
    }
  }

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})
  const STATUS_COLORS = { cancelled: '#ef4444', failed: '#f97316' }
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: STATUS_LABELS[status]?.label || status, count, status
  }))

  return (
    <div className="space-y-4">

      {/* Confirm cancel dialog */}
      <Dialog open={!!cancelling} onOpenChange={v => !v && setCancelling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar pedido #{cancelling?.number || cancelling?.id}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            O pedido de <strong>{cancelling?.billing?.first_name} {cancelling?.billing?.last_name}</strong> ({fmt(cancelling?.total)}) será cancelado no WooCommerce. Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelling(null)} disabled={cancelBusy}>Voltar</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelBusy}>
              {cancelBusy ? 'Cancelando...' : 'Confirmar cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500">Lista de pedidos do WooCommerce</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Status dos Pedidos</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || getBrand()} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Carregando pedidos...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">{error ? 'Erro ao carregar' : 'Nenhum pedido encontrado'}</div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map(o => {
                      const statusInfo = STATUS_LABELS[o.status] || { label: o.status, variant: 'secondary' }
                      return (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium text-sm">#{o.number || o.id}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {o.billing?.first_name} {o.billing?.last_name}
                          </TableCell>
                          <TableCell><Badge variant={statusInfo.variant}>{statusInfo.label}</Badge></TableCell>
                          <TableCell className="font-medium text-sm">{fmt(o.total)}</TableCell>
                          <TableCell className="text-sm text-gray-500">{fmtDate(o.date_created)}</TableCell>
                          <TableCell>
                            {CANCELLABLE.includes(o.status) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-400 hover:text-red-500"
                                title="Cancelar pedido"
                                onClick={() => setCancelling(o)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-gray-100">
                {orders.map(o => {
                  const statusInfo = STATUS_LABELS[o.status] || { label: o.status, variant: 'secondary' }
                  return (
                    <div key={o.id} className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-gray-900">#{o.number || o.id}</span>
                        <span className="font-bold text-sm text-gray-900">{fmt(o.total)}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {o.billing?.first_name} {o.billing?.last_name}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{fmtDate(o.date_created)}</span>
                          {CANCELLABLE.includes(o.status) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-400 hover:text-red-500"
                              onClick={() => setCancelling(o)}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {orders.length > 0 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>Anterior</Button>
          <span className="text-sm text-gray-500 px-2">Página {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={orders.length < 20 || loading}>Próxima</Button>
        </div>
      )}
    </div>
  )
}
