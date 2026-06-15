import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, XCircle, MessageCircle, ChevronDown, Search, Truck, FileText, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { wooProxy, pagbankProxy, melhorEnvioProxy, blingProxy, mercadoPagoProxy } from '@/lib/api'

const getBrand = () => getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#6366f1'

const STATUS = {
  pending:    { label: 'Pendente',    color: 'bg-amber-100 text-amber-700' },
  processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700' },
  'on-hold':  { label: 'Em espera',   color: 'bg-gray-100 text-gray-600' },
  completed:  { label: 'Concluído',   color: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'Cancelado',   color: 'bg-red-100 text-red-600' },
  refunded:   { label: 'Reembolsado', color: 'bg-purple-100 text-purple-700' },
  failed:     { label: 'Falhou',      color: 'bg-red-100 text-red-600' },
}

const ALL_STATUSES = Object.keys(STATUS)
const CANCELLABLE  = ['pending', 'processing', 'on-hold']

const fmt     = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

const wa = (order) => {
  const raw = (order.billing?.phone || '').replace(/\D/g, '')
  if (!raw) return alert('Telefone não cadastrado.')
  const phone = raw.startsWith('55') ? raw : `55${raw}`
  const name  = order.billing?.first_name || ''
  const msgs  = {
    pending:    `Olá, ${name}! Vimos que seu pedido #${order.number || order.id} (${fmt(order.total)}) ainda está pendente. Precisa de ajuda para finalizar? 😊`,
    'on-hold':  `Olá, ${name}! Seu pedido #${order.number || order.id} está aguardando confirmação do pagamento. Qualquer dúvida, é só chamar! 🍺`,
    processing: `Olá, ${name}! Pedido #${order.number || order.id} confirmado e sendo preparado. Em breve você receberá o rastreamento. Obrigado! 🍺`,
    completed:  `Olá, ${name}! Esperamos que tenha curtido o pedido #${order.number || order.id}. Deixa uma avaliação, nos ajuda muito! 😊`,
    cancelled:  `Olá, ${name}! Seu pedido #${order.number || order.id} foi cancelado. Se quiser fazer um novo, é só chamar! 🍺`,
  }
  const text = msgs[order.status] || `Olá, ${name}! Tudo certo com seu pedido #${order.number || order.id}?`
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
}

const getPagBankId = (order) =>
  (order.meta_data || []).find(m => m.key?.includes('pagbank') || m.key?.includes('charge_id'))?.value || null

const getMPPaymentId = (order) =>
  (order.meta_data || []).find(m =>
    ['_Mercado_Pago_Payment_Id','_mp_payment_id','mp_payment_id','_mp-payment-id'].includes(m.key)
  )?.value || null

const MP_STATUS = {
  approved:    { label: 'Aprovado',     color: 'text-green-600' },
  pending:     { label: 'Pendente',     color: 'text-amber-600' },
  authorized:  { label: 'Autorizado',   color: 'text-blue-600' },
  in_process:  { label: 'Em análise',   color: 'text-blue-600' },
  in_mediation:{ label: 'Em disputa',   color: 'text-orange-600' },
  rejected:    { label: 'Rejeitado',    color: 'text-red-600' },
  cancelled:   { label: 'Cancelado',    color: 'text-red-600' },
  refunded:    { label: 'Reembolsado',  color: 'text-purple-600' },
  charged_back:{ label: 'Estorno',      color: 'text-purple-600' },
}

const getCPF = (order) =>
  order.billing?.cpf
  || (order.meta_data || []).find(m => ['_billing_cpf','billing_cpf','_cpf','cpf','vindi_cpf','wc_cpf'].includes(m.key))?.value
  || null

function StatusPill({ status }) {
  const s = STATUS[status] || { label: status, color: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${s.color}`}>
      {s.label}
    </span>
  )
}

function OrderRow({ order, onUpdate, onCancelRequest }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(null)

  const act = async (key, fn) => { setBusy(key); try { await fn() } catch (e) { alert(e.message) } finally { setBusy(null) } }

  const changeStatus = (newStatus) => act('status', async () => {
    await wooProxy({ method: 'PUT', endpoint: `orders/${order.id}`, body: { status: newStatus } })
    onUpdate(order.id, { status: newStatus })
  })

  const checkPagBank = () => act('pagbank', async () => {
    const id = getPagBankId(order)
    if (!id) throw new Error('ID de cobrança PagBank não encontrado.')
    const r = await pagbankProxy({ endpoint: `charges/${id}` })
    const st = r?.charges?.[0]?.status || r?.status
    if (st === 'PAID') { await changeStatus('processing'); alert('Pagamento confirmado!') }
    else alert(`Status PagBank: ${st || 'desconhecido'}`)
  })

  const refund = () => act('pagbank', async () => {
    const id = getPagBankId(order)
    if (!id) throw new Error('ID de cobrança não encontrado.')
    if (!confirm(`Reembolsar ${fmt(order.total)} para ${order.billing?.first_name}?`)) return
    await pagbankProxy({ method: 'POST', endpoint: `charges/${id}/cancel` })
    await changeStatus('refunded')
    alert('Reembolso solicitado!')
  })

  const genLabel = () => act('me', async () => {
    const r = await melhorEnvioProxy({ action: 'generate_label', order })
    if (r?.label_url) { window.open(r.label_url, '_blank'); onUpdate(order.id, { _tracking: r.tracking }) }
  })

  const emitNFe = () => act('bling', async () => {
    const r = await blingProxy({ action: 'emit_nfe', order })
    onUpdate(order.id, { _nfe_number: r.numero, _nfe_status: r.situacao })
    alert(`NF-e emitida! Nº ${r.numero}`)
  })

  const [mpInfo, setMpInfo] = useState(null)

  const checkMP = () => act('mp', async () => {
    const pid = getMPPaymentId(order)
    const r = await mercadoPagoProxy({ action: 'check_payment', payment_id: pid, order })
    setMpInfo(r)
    const s = MP_STATUS[r.status]
    if (r.status === 'approved' && !['processing','completed'].includes(order.status)) {
      await changeStatus('processing')
    }
    alert(`Mercado Pago: ${s?.label || r.status}\n${r.status_detail || ''}\nValor: ${fmt(r.amount)}`)
  })

  const refundMP = () => act('mp', async () => {
    const pid = getMPPaymentId(order) || mpInfo?.id
    if (!pid) throw new Error('Consulte o pagamento primeiro para obter o ID MP.')
    if (!confirm(`Reembolsar ${fmt(order.total)} para ${order.billing?.first_name}?`)) return
    await mercadoPagoProxy({ action: 'refund', payment_id: pid })
    await changeStatus('refunded')
    alert('Reembolso solicitado ao Mercado Pago!')
  })

  const isPagBank = order.payment_method?.includes('pagbank') || order.payment_method_title?.toLowerCase().includes('pagbank')
  const isMP = order.payment_method?.includes('mercado') || order.payment_method?.includes('woo-mercado-pago') || order.payment_method_title?.toLowerCase().includes('mercado')
  const phone = (order.billing?.phone || '').replace(/\D/g, '')
  const rowBg = open ? 'bg-gray-50/60' : 'hover:bg-gray-50/60'

  return (
    <>
      {/* Main row */}
      <tr
        className={`border-b border-gray-100 last:border-0 cursor-pointer select-none transition-colors ${rowBg}`}
        onClick={() => setOpen(v => !v)}
      >
        <td className="pl-5 py-3.5 align-middle">
          <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </td>
        <td className="py-3.5 pr-3 align-middle text-sm font-semibold text-gray-800">
          #{order.number || order.id}
        </td>
        <td className="py-3.5 pr-4 align-middle overflow-hidden">
          <span className="block truncate text-sm text-gray-700">
            {order.billing?.first_name} {order.billing?.last_name}
          </span>
        </td>
        <td className="hidden sm:table-cell py-3.5 pr-4 align-middle overflow-hidden">
          <span className="block truncate text-sm text-gray-400">
            {order.billing?.phone || '—'}
          </span>
        </td>
        <td className="py-3.5 pr-4 align-middle">
          <StatusPill status={order.status} />
        </td>
        <td className="py-3.5 pr-4 align-middle text-right text-sm font-semibold text-gray-800">
          {fmt(order.total)}
        </td>
        <td className="hidden md:table-cell py-3.5 pr-5 align-middle text-right text-xs text-gray-400">
          {fmtDate(order.date_created)}
        </td>
        <td className="py-3.5 pr-5 align-middle" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-0.5 justify-end">
            {phone && (
              <button
                onClick={() => wa(order)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-green-500 hover:bg-green-50 transition-colors"
                title="Enviar WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            )}
            {CANCELLABLE.includes(order.status) && (
              <button
                onClick={() => onCancelRequest(order)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Cancelar pedido"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded row */}
      {open && (
        <tr className="bg-gray-50/60 border-b border-gray-100 last:border-0">
          <td colSpan={8} className="px-5 pb-5 pt-3">
            <div className="space-y-4">

              {/* Line items */}
              <div className="space-y-2">
                {(order.line_items || []).map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {item.image?.src
                      ? <img src={item.image.src} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-100" />
                      : <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0" />
                    }
                    <span className="flex-1 text-sm text-gray-700">{item.name}</span>
                    <span className="text-xs text-gray-400 tabular-nums">×{item.quantity}</span>
                    <span className="w-20 text-right text-sm font-medium text-gray-800 tabular-nums">{fmt(item.total)}</span>
                  </div>
                ))}
              </div>

              <div className="h-px bg-gray-200" />

              {/* Info + Actions grid */}
              <div className="flex flex-wrap gap-8">

                {/* Customer */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Cliente</p>
                  <p className="text-sm font-medium text-gray-700">{order.billing?.first_name} {order.billing?.last_name}</p>
                  {order.billing?.email && <p className="text-xs text-gray-400 mt-0.5">{order.billing.email}</p>}
                  {getCPF(order) && <p className="text-xs font-mono text-gray-500 mt-0.5">CPF {getCPF(order)}</p>}
                  {order.billing?.phone && <p className="text-xs text-gray-400 mt-0.5">{order.billing.phone}</p>}
                </div>

                {/* Delivery */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Entrega</p>
                  <p className="text-sm text-gray-700">
                    {order.shipping?.address_1}{order.shipping?.address_2 ? `, ${order.shipping.address_2}` : ''}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.shipping?.city}{order.shipping?.state ? ` · ${order.shipping.state}` : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{order.shipping?.postcode}</p>
                </div>

                {/* Payment */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Pagamento</p>
                  <p className="text-sm text-gray-700">{order.payment_method_title || '—'}</p>
                  {isPagBank && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={checkPagBank}
                        disabled={!!busy}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-40 transition-colors"
                      >
                        {busy === 'pagbank' ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
                        Verificar
                      </button>
                      {['processing', 'completed'].includes(order.status) && (
                        <button
                          onClick={refund}
                          disabled={!!busy}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-40 transition-colors"
                        >
                          Reembolsar
                        </button>
                      )}
                    </div>
                  )}
                  {isMP && (
                    <div className="flex flex-col gap-1.5 mt-2">
                      {mpInfo && (
                        <span className={`text-xs font-medium ${MP_STATUS[mpInfo.status]?.color || 'text-gray-500'}`}>
                          {MP_STATUS[mpInfo.status]?.label || mpInfo.status}
                          {mpInfo.status_detail ? ` · ${mpInfo.status_detail}` : ''}
                        </span>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={checkMP}
                          disabled={!!busy}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-40 transition-colors"
                        >
                          {busy === 'mp' ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
                          Verificar MP
                        </button>
                        {['processing', 'completed'].includes(order.status) && (
                          <button
                            onClick={refundMP}
                            disabled={!!busy}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-40 transition-colors"
                          >
                            Reembolsar
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status change */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Alterar status</p>
                  <Select value={order.status} onValueChange={changeStatus} disabled={busy === 'status'}>
                    <SelectTrigger className="h-8 text-xs w-40 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map(s => (
                        <SelectItem key={s} value={s} className="text-xs">{STATUS[s]?.label || s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Logistics */}
                <div className="flex items-end gap-2 ml-auto">
                  {order._tracking ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Rastreio</p>
                      <span className="text-xs font-mono text-gray-600">{order._tracking}</span>
                    </div>
                  ) : (
                    <button
                      onClick={genLabel}
                      disabled={!!busy}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-900 hover:bg-gray-700 text-white disabled:opacity-40 transition-colors"
                    >
                      {busy === 'me' ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />}
                      Gerar etiqueta
                    </button>
                  )}

                  {order._nfe_number ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">NF-e</p>
                      <span className="text-xs font-mono text-gray-600">Nº {order._nfe_number}</span>
                    </div>
                  ) : (
                    <button
                      onClick={emitNFe}
                      disabled={!!busy}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-40 transition-colors"
                    >
                      {busy === 'bling' ? <RefreshCw className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                      Emitir NF-e
                    </button>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function Orders() {
  const [orders,       setOrders]       = useState([])
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [page,         setPage]         = useState(1)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search,       setSearch]       = useState('')
  const [cancelTarget, setCancelTarget] = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await wooProxy({ endpoint: `orders?per_page=50&page=${page}&orderby=date&order=desc` })
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page])

  const updateOrder = (id, patch) => setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o))

  const confirmCancel = async () => {
    if (!cancelTarget) return
    try {
      await wooProxy({ method: 'PUT', endpoint: `orders/${cancelTarget.id}`, body: { status: 'cancelled' } })
      updateOrder(cancelTarget.id, { status: 'cancelled' })
    } catch (e) { alert(e.message) }
    setCancelTarget(null)
  }

  const filtered = orders.filter(o => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return `${o.billing?.first_name} ${o.billing?.last_name}`.toLowerCase().includes(q)
          || String(o.number || o.id).includes(q)
    }
    return true
  })

  const counts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc }, {})
  const STATUS_COLORS = { cancelled: '#ef4444', failed: '#f97316' }
  const chartData = Object.entries(counts).map(([s, c]) => ({ name: STATUS[s]?.label || s, count: c, status: s }))

  const filters = [
    { value: 'all', label: 'Todos', count: orders.length },
    ...['pending', 'on-hold', 'processing', 'completed', 'cancelled'].map(s => ({
      value: s, label: STATUS[s].label, count: counts[s] || 0
    })).filter(f => f.count > 0),
  ]

  return (
    <div className="space-y-5">

      {/* Cancel dialog — rendered at top level to avoid invalid HTML inside <tbody> */}
      <Dialog open={!!cancelTarget} onOpenChange={v => !v && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar pedido #{cancelTarget?.number || cancelTarget?.id}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Pedido de <strong>{cancelTarget?.billing?.first_name} {cancelTarget?.billing?.last_name}</strong> ({fmt(cancelTarget?.total)}) será cancelado. Essa ação é irreversível.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Voltar</Button>
            <Button variant="destructive" onClick={confirmCancel}>Cancelar pedido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-400">{orders.length} pedidos · WooCommerce</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />{error}
        </div>
      )}

      {/* Status chart */}
      {chartData.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Distribuição de status</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {chartData.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.status] || getBrand()} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300 pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cliente ou nº do pedido..."
            className="pl-9 h-9 text-sm bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filterStatus === f.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {f.label}{f.count > 0 && f.value !== 'all' ? ` · ${f.count}` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: '2.25rem' }} />   {/* chevron */}
            <col style={{ width: '4.5rem' }} />    {/* # pedido */}
            <col />                                {/* cliente — ocupa o restante */}
            <col className="hidden sm:table-column" style={{ width: '9rem' }} />  {/* telefone */}
            <col style={{ width: '7.5rem' }} />    {/* status */}
            <col style={{ width: '6.5rem' }} />    {/* total */}
            <col className="hidden md:table-column" style={{ width: '5rem' }} />  {/* data */}
            <col style={{ width: '5rem' }} />      {/* ações */}
          </colgroup>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              <th className="pl-5 py-2.5" />
              <th className="py-2.5 text-left">Pedido</th>
              <th className="py-2.5 text-left">Cliente</th>
              <th className="hidden sm:table-cell py-2.5 text-left">Telefone</th>
              <th className="py-2.5 text-left">Status</th>
              <th className="py-2.5 pr-4 text-right">Total</th>
              <th className="hidden md:table-cell py-2.5 pr-5 text-right">Data</th>
              <th className="py-2.5 pr-5" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-sm text-gray-300">Carregando pedidos...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-sm text-gray-300">Nenhum pedido encontrado</td>
              </tr>
            ) : (
              filtered.map(o => (
                <OrderRow key={o.id} order={o} onUpdate={updateOrder} onCancelRequest={setCancelTarget} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {orders.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">{filtered.length} de {orders.length} pedidos</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>
              Anterior
            </Button>
            <span className="flex items-center px-3 text-gray-500">Página {page}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={orders.length < 50 || loading}>
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
