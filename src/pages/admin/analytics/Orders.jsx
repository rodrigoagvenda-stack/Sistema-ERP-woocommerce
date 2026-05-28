import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, XCircle, MessageCircle, ChevronDown, ChevronRight, Search, MapPin, CreditCard, Package, FileText, Truck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { wooProxy, pagbankProxy, melhorEnvioProxy, blingProxy } from '@/lib/api'

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
const ALL_STATUSES = ['pending', 'on-hold', 'processing', 'completed', 'cancelled', 'refunded', 'failed']

const fmt     = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR')

const WHATSAPP_MESSAGES = {
  pending:    (o) => `Olá, ${o.billing?.first_name}! 😊 Vimos que você iniciou o pedido #${o.number || o.id} no valor de ${fmt(o.total)} em nossa loja, mas o pagamento ainda não foi confirmado. Precisa de ajuda para finalizar? Estamos à disposição!`,
  'on-hold':  (o) => `Olá, ${o.billing?.first_name}! Seu pedido #${o.number || o.id} (${fmt(o.total)}) está aguardando confirmação de pagamento. Assim que confirmarmos, você receberá uma atualização. Qualquer dúvida, é só falar! 🍺`,
  processing: (o) => `Olá, ${o.billing?.first_name}! Seu pedido #${o.number || o.id} (${fmt(o.total)}) foi confirmado e está sendo preparado. Em breve você receberá informações de rastreamento. Obrigado pela compra! 🍺`,
  completed:  (o) => `Olá, ${o.billing?.first_name}! Esperamos que tenha curtido seu pedido #${o.number || o.id}. Deixa uma avaliação, é rápido e nos ajuda muito! Qualquer dúvida, estamos aqui. 😊`,
  cancelled:  (o) => `Olá, ${o.billing?.first_name}! Vimos que seu pedido #${o.number || o.id} foi cancelado. Se foi um engano ou quiser fazer um novo pedido, é só nos chamar! 🍺`,
}

const openWhatsApp = (order) => {
  const raw = (order.billing?.phone || '').replace(/\D/g, '')
  if (!raw) return alert('Este pedido não possui telefone cadastrado.')
  const phone = raw.startsWith('55') ? raw : `55${raw}`
  const msgFn = WHATSAPP_MESSAGES[order.status] || ((o) => `Olá, ${o.billing?.first_name}! Tudo bem com seu pedido #${o.number || o.id}?`)
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msgFn(order))}`, '_blank')
}

const getPagBankChargeId = (order) => {
  const meta = order.meta_data || []
  const key = meta.find(m =>
    m.key?.includes('pagbank') || m.key?.includes('charge_id') || m.key?.includes('transaction')
  )
  return key?.value || null
}

export default function Orders() {
  const [orders,       setOrders]       = useState([])
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [page,         setPage]         = useState(1)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search,       setSearch]       = useState('')
  const [expanded,     setExpanded]     = useState({})
  const [cancelling,   setCancelling]   = useState(null)
  const [cancelBusy,   setCancelBusy]   = useState(false)
  const [statusBusy,   setStatusBusy]   = useState(null)
  const [pagbankBusy,  setPagbankBusy]  = useState(null)
  const [meBusy,       setMeBusy]       = useState(null)
  const [blingBusy,    setBlingBusy]    = useState(null)
  const [toast,        setToast]        = useState(null)

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000) }

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await wooProxy({ endpoint: `orders?per_page=50&page=${page}&orderby=date&order=desc` })
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [page])

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  // ── Change order status ──────────────────────────────────────────
  const handleChangeStatus = async (order, newStatus) => {
    setStatusBusy(order.id)
    try {
      await wooProxy({ method: 'PUT', endpoint: `orders/${order.id}`, body: { status: newStatus } })
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o))
      showToast('success', `Status atualizado para "${STATUS_LABELS[newStatus]?.label || newStatus}"`)
    } catch (e) { showToast('error', 'Erro ao atualizar status: ' + e.message) }
    finally { setStatusBusy(null) }
  }

  // ── Cancel ───────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!cancelling) return
    setCancelBusy(true)
    try {
      await wooProxy({ method: 'PUT', endpoint: `orders/${cancelling.id}`, body: { status: 'cancelled' } })
      setOrders(prev => prev.map(o => o.id === cancelling.id ? { ...o, status: 'cancelled' } : o))
      setCancelling(null)
    } catch (e) { showToast('error', 'Erro ao cancelar: ' + e.message) }
    finally { setCancelBusy(false) }
  }

  // ── PagBank: verificar pagamento ─────────────────────────────────
  const handleCheckPagBank = async (order) => {
    const chargeId = getPagBankChargeId(order)
    if (!chargeId) return showToast('error', 'ID de cobrança PagBank não encontrado neste pedido.')
    setPagbankBusy(order.id)
    try {
      const result = await pagbankProxy({ endpoint: `charges/${chargeId}` })
      if (result?.charges?.[0]?.status === 'PAID' || result?.status === 'PAID') {
        await handleChangeStatus(order, 'processing')
        showToast('success', 'Pagamento confirmado! Status atualizado para Processando.')
      } else {
        showToast('error', `Status no PagBank: ${result?.charges?.[0]?.status || result?.status || 'desconhecido'}`)
      }
    } catch (e) { showToast('error', 'Erro ao consultar PagBank: ' + e.message) }
    finally { setPagbankBusy(null) }
  }

  // ── PagBank: reembolso ───────────────────────────────────────────
  const handleRefundPagBank = async (order) => {
    const chargeId = getPagBankChargeId(order)
    if (!chargeId) return showToast('error', 'ID de cobrança PagBank não encontrado.')
    if (!window.confirm(`Confirmar reembolso de ${fmt(order.total)} para ${order.billing?.first_name}?`)) return
    setPagbankBusy(order.id)
    try {
      await pagbankProxy({ method: 'POST', endpoint: `charges/${chargeId}/cancel` })
      await handleChangeStatus(order, 'refunded')
      showToast('success', 'Reembolso solicitado com sucesso!')
    } catch (e) { showToast('error', 'Erro ao reembolsar: ' + e.message) }
    finally { setPagbankBusy(null) }
  }

  // ── Melhor Envio: gerar etiqueta ─────────────────────────────────
  const handleGenerateLabel = async (order) => {
    setMeBusy(order.id)
    try {
      const result = await melhorEnvioProxy({ action: 'generate_label', order_id: order.id, order })
      if (result?.label_url) {
        window.open(result.label_url, '_blank')
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, _tracking: result.tracking } : o))
        showToast('success', 'Etiqueta gerada! Abrindo para impressão...')
      }
    } catch (e) { showToast('error', 'Erro ao gerar etiqueta: ' + e.message) }
    finally { setMeBusy(null) }
  }

  // ── Bling: emitir NF-e ───────────────────────────────────────────
  const handleEmitNFe = async (order) => {
    setBlingBusy(order.id)
    try {
      const result = await blingProxy({ action: 'emit_nfe', order })
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, _nfe_number: result.numero, _nfe_status: result.situacao } : o))
      showToast('success', `NF-e emitida! Número: ${result.numero}`)
    } catch (e) { showToast('error', 'Erro ao emitir NF-e: ' + e.message) }
    finally { setBlingBusy(null) }
  }

  // ── Filtering ────────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const name = `${o.billing?.first_name || ''} ${o.billing?.last_name || ''}`.toLowerCase()
      const num = String(o.number || o.id)
      return name.includes(q) || num.includes(q)
    }
    return true
  })

  const statusCounts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc }, {})
  const STATUS_COLORS = { cancelled: '#ef4444', failed: '#f97316' }
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: STATUS_LABELS[status]?.label || status, count, status
  }))

  return (
    <div className="space-y-4">

      {/* Toast */}
      {toast && (
        <Alert variant={toast.type === 'error' ? 'destructive' : 'success'} className="fixed bottom-4 right-4 w-auto max-w-sm z-50 shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{toast.msg}</AlertDescription>
        </Alert>
      )}

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500">{orders.length} pedidos carregados</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      {/* Chart */}
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

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente ou nº do pedido..." className="pl-9 h-9 text-sm" />
        </div>
        <div className="flex flex-wrap gap-1">
          {[{ value: 'all', label: 'Todos' }, ...ALL_STATUSES.map(s => ({ value: s, label: STATUS_LABELS[s]?.label || s }))].map(f => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterStatus === f.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
            >
              {f.label}{f.value !== 'all' && statusCounts[f.value] ? ` (${statusCounts[f.value]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Carregando pedidos...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">{error ? 'Erro ao carregar' : 'Nenhum pedido encontrado'}</div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" />
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(o => {
                      const statusInfo = STATUS_LABELS[o.status] || { label: o.status, variant: 'secondary' }
                      const isExpanded = !!expanded[o.id]
                      const phone = (o.billing?.phone || '').replace(/\D/g, '')
                      const isPagBank = o.payment_method?.includes('pagbank') || o.payment_method_title?.toLowerCase().includes('pagbank')

                      return (
                        <>
                          <TableRow key={o.id} className="cursor-pointer hover:bg-gray-50/50" onClick={() => toggleExpand(o.id)}>
                            <TableCell className="pr-0">
                              {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                            </TableCell>
                            <TableCell className="font-medium text-sm">#{o.number || o.id}</TableCell>
                            <TableCell className="text-sm text-gray-600">{o.billing?.first_name} {o.billing?.last_name}</TableCell>
                            <TableCell className="text-sm text-gray-500">{o.billing?.phone || '—'}</TableCell>
                            <TableCell><Badge variant={statusInfo.variant}>{statusInfo.label}</Badge></TableCell>
                            <TableCell className="font-medium text-sm">{fmt(o.total)}</TableCell>
                            <TableCell className="text-sm text-gray-500">{fmtDate(o.date_created)}</TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                {phone && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500 hover:text-green-700" title="WhatsApp" onClick={() => openWhatsApp(o)}>
                                    <MessageCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                {CANCELLABLE.includes(o.status) && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" title="Cancelar" onClick={() => setCancelling(o)}>
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>

                          {isExpanded && (
                            <TableRow key={`${o.id}-detail`}>
                              <TableCell colSpan={8} className="p-0 bg-gray-50/50 border-b">
                                <div className="px-6 py-4 grid grid-cols-1 gap-4">

                                  {/* Itens */}
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> Itens do pedido</p>
                                    <div className="space-y-1">
                                      {(o.line_items || []).map((item, i) => (
                                        <div key={i} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                                          <div className="flex items-center gap-2">
                                            {item.image?.src && <img src={item.image.src} alt="" className="w-8 h-8 rounded object-cover" />}
                                            <span className="text-sm text-gray-700">{item.name}</span>
                                          </div>
                                          <div className="flex items-center gap-6 text-sm">
                                            <span className="text-gray-400">x{item.quantity}</span>
                                            <span className="font-medium text-gray-700">{fmt(item.total)}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    {/* Endereço */}
                                    <div>
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Endereço de entrega</p>
                                      <div className="text-sm text-gray-600 space-y-0.5">
                                        <p>{o.shipping?.address_1}{o.shipping?.address_2 ? `, ${o.shipping.address_2}` : ''}</p>
                                        <p>{o.shipping?.city}{o.shipping?.state ? ` — ${o.shipping.state}` : ''}</p>
                                        <p className="font-mono text-xs text-gray-400">CEP: {o.shipping?.postcode}</p>
                                      </div>
                                    </div>

                                    {/* Pagamento */}
                                    <div>
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Pagamento</p>
                                      <p className="text-sm text-gray-600 mb-2">{o.payment_method_title || o.payment_method || '—'}</p>
                                      {isPagBank && (
                                        <div className="flex gap-2 flex-wrap">
                                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={pagbankBusy === o.id} onClick={() => handleCheckPagBank(o)}>
                                            {pagbankBusy === o.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
                                            Verificar pagamento
                                          </Button>
                                          {o.status === 'processing' || o.status === 'completed' ? (
                                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-500 border-red-200" disabled={pagbankBusy === o.id} onClick={() => handleRefundPagBank(o)}>
                                              Reembolsar
                                            </Button>
                                          ) : null}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-4">
                                    {/* Mudar status */}
                                    <div>
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mudar status</p>
                                      <Select value={o.status} onValueChange={v => handleChangeStatus(o, v)} disabled={statusBusy === o.id}>
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {ALL_STATUSES.map(s => (
                                            <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s]?.label || s}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {/* Melhor Envio */}
                                    <div>
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Melhor Envio</p>
                                      {o._tracking ? (
                                        <p className="text-xs text-gray-500 font-mono">Rastreio: {o._tracking}</p>
                                      ) : (
                                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={meBusy === o.id} onClick={() => handleGenerateLabel(o)}>
                                          {meBusy === o.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />}
                                          Gerar etiqueta
                                        </Button>
                                      )}
                                    </div>

                                    {/* Bling NF-e */}
                                    <div>
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> NF-e (Bling)</p>
                                      {o._nfe_number ? (
                                        <div className="text-xs text-gray-500 space-y-0.5">
                                          <p>Nº {o._nfe_number}</p>
                                          <Badge variant="success" className="text-[10px]">{o._nfe_status}</Badge>
                                        </div>
                                      ) : (
                                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={blingBusy === o.id} onClick={() => handleEmitNFe(o)}>
                                          {blingBusy === o.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                                          Emitir NF-e
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-gray-100">
                {filtered.map(o => {
                  const statusInfo = STATUS_LABELS[o.status] || { label: o.status, variant: 'secondary' }
                  const isExpanded = !!expanded[o.id]
                  return (
                    <div key={o.id} className="p-4">
                      <div className="flex items-center justify-between mb-1 cursor-pointer" onClick={() => toggleExpand(o.id)}>
                        <span className="font-semibold text-sm text-gray-900 flex items-center gap-1">
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                          #{o.number || o.id}
                        </span>
                        <span className="font-bold text-sm text-gray-900">{fmt(o.total)}</span>
                      </div>
                      <p className="text-xs text-gray-500">{o.billing?.first_name} {o.billing?.last_name}</p>
                      {o.billing?.phone && <p className="text-xs text-gray-400">{o.billing.phone}</p>}
                      {isExpanded && (
                        <div className="mt-3 space-y-3">
                          <div className="space-y-1 bg-white rounded-lg border border-gray-100 p-2">
                            {(o.line_items || []).map((item, i) => (
                              <div key={i} className="flex items-center justify-between text-xs py-0.5">
                                <span className="text-gray-600">{item.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-400">x{item.quantity}</span>
                                  <span className="font-medium">{fmt(item.total)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-gray-500 space-y-0.5">
                            <p className="font-medium text-gray-600">{o.shipping?.address_1}, {o.shipping?.city} — {o.shipping?.postcode}</p>
                            <p>{o.payment_method_title}</p>
                          </div>
                          <Select value={o.status} onValueChange={v => handleChangeStatus(o, v)} disabled={statusBusy === o.id}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ALL_STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s]?.label || s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={meBusy === o.id} onClick={() => handleGenerateLabel(o)}>
                              <Truck className="h-3 w-3" /> Etiqueta
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={blingBusy === o.id} onClick={() => handleEmitNFe(o)}>
                              <FileText className="h-3 w-3" /> NF-e
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">{fmtDate(o.date_created)}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-green-500 hover:text-green-700" onClick={() => openWhatsApp(o)}>
                            <MessageCircle className="h-3.5 w-3.5" />
                          </Button>
                          {CANCELLABLE.includes(o.status) && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500" onClick={() => setCancelling(o)}>
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
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={orders.length < 50 || loading}>Próxima</Button>
        </div>
      )}
    </div>
  )
}
