import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, Search, TrendingUp, CheckCircle2, Clock, Package, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

const PAGE_SIZE = 20
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { getCompanyId } from '@/lib/company'
import { mercadoPagoProxy } from '@/lib/api'

const fmt     = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
const fmtDate = (d) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

const STATUS = {
  pending:   { label: 'Pendente',    color: 'bg-yellow-100 text-yellow-700' },
  approved:  { label: 'Aprovado',    color: 'bg-green-100 text-green-700'   },
  rejected:  { label: 'Rejeitado',   color: 'bg-red-100 text-red-700'       },
  cancelled: { label: 'Cancelado',   color: 'bg-gray-100 text-gray-500'     },
  refunded:  { label: 'Reembolsado', color: 'bg-purple-100 text-purple-700' },
}

const FILTERS = [
  { key: null,        label: 'Todos'       },
  { key: 'approved',  label: 'Aprovados'   },
  { key: 'pending',   label: 'Pendentes'   },
  { key: 'rejected',  label: 'Rejeitados'  },
  { key: 'cancelled', label: 'Cancelados'  },
]

function SummaryCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function KitOrders() {
  const [orders,       setOrders]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const [page,         setPage]         = useState(0)
  const [syncing,      setSyncing]      = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const cid = await getCompanyId()
      const { data } = await supabase
        .from('kit_orders')
        .select('*')
        .eq('company_id', cid)
        .order('created_at', { ascending: false })
        .limit(500)
      setOrders(data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const syncOrder = async (o) => {
    if (!o.external_reference) return alert('Pedido sem external_reference — não é possível sincronizar.')
    setSyncing(s => ({ ...s, [o.id]: true }))
    try {
      const payment = await mercadoPagoProxy({ action: 'check_payment', order: { id: o.external_reference } })
      const statusMap = { approved: 'approved', pending: 'pending', in_process: 'pending', rejected: 'rejected', cancelled: 'cancelled', refunded: 'refunded', charged_back: 'refunded' }
      const methodMap = { credit_card: 'Cartão de crédito', debit_card: 'Cartão de débito', ticket: 'Boleto', bank_transfer: 'Pix', account_money: 'Saldo MP' }
      const newStatus = statusMap[payment.status] || payment.status
      const method    = methodMap[payment.type] || payment.type || payment.method
      await supabase.from('kit_orders').update({ status: newStatus, mp_payment_id: String(payment.id), payment_method: method })
        .eq('id', o.id)
      setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: newStatus, mp_payment_id: String(payment.id), payment_method: method } : x))
    } catch (e) { alert('Erro ao sincronizar: ' + e.message) }
    finally { setSyncing(s => ({ ...s, [o.id]: false })) }
  }

  const filtered = useMemo(() => {
    let list = orders
    if (statusFilter) list = list.filter(o => o.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(o =>
        (o.customer_name  || '').toLowerCase().includes(q) ||
        (o.customer_email || '').toLowerCase().includes(q) ||
        (o.customer_phone || '').includes(q) ||
        (o.kit_name       || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [orders, statusFilter, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageSlice  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const changePage = (p) => { setPage(Math.max(0, Math.min(p, totalPages - 1))); window.scrollTo(0, 0) }

  // Reset page when filter/search changes
  useMemo(() => { setPage(0) }, [statusFilter, search])

  const approved = orders.filter(o => o.status === 'approved')
  const pending  = orders.filter(o => o.status === 'pending')
  const revenue  = approved.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pedidos de Kit</h1>
          <p className="text-sm text-gray-400">{orders.length} pedidos no total</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={Package}      label="Total de pedidos" value={orders.length}    color="bg-blue-100 text-blue-600" />
        <SummaryCard icon={TrendingUp}   label="Receita aprovada" value={fmt(revenue)}     color="bg-green-100 text-green-600" />
        <SummaryCard icon={CheckCircle2} label="Aprovados"        value={approved.length}  color="bg-green-100 text-green-600" />
        <SummaryCard icon={Clock}        label="Pendentes"        value={pending.length}   color="bg-yellow-100 text-yellow-600" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Buscar por nome, e-mail, kit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 text-sm h-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={String(f.key)}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === f.key ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 text-center py-16">Carregando pedidos...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-16">Nenhum pedido encontrado.</div>
      ) : (
        <>
        {/* Desktop */}
        <div className="hidden md:block rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Kit</th>
                <th className="text-left px-4 py-3">Endereço</th>
                <th className="text-left px-4 py-3">Frete</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Pagamento</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageSlice.map(o => {
                const st   = STATUS[o.status] || { label: o.status, color: 'bg-gray-100 text-gray-500' }
                const addr = o.customer_address || {}
                return (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{o.customer_name || '—'}</p>
                      <p className="text-xs text-gray-400">{o.customer_email || ''}</p>
                      <p className="text-xs text-gray-400">{o.customer_phone || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{o.kit_name || '—'}</td>
                    <td className="px-4 py-3">
                      {addr.street ? (
                        <div className="text-xs text-gray-500 leading-relaxed">
                          <p>{addr.street}, {addr.number}{addr.complement ? ` — ${addr.complement}` : ''}</p>
                          <p>{addr.neighborhood} · {addr.city}/{addr.state}</p>
                          <p className="text-gray-400">CEP {o.customer_cep}</p>
                        </div>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{fmt(o.shipping_cost)}</p>
                      {o.shipping_name && <p className="text-xs text-gray-400">{o.shipping_name}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmt(o.total_amount)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{o.payment_method || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                        {o.status === 'pending' && (
                          <button
                            onClick={() => syncOrder(o)}
                            disabled={syncing[o.id]}
                            title="Verificar no Mercado Pago"
                            className="p-0.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 transition-colors"
                          >
                            <RotateCcw className={`h-3 w-3 ${syncing[o.id] ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(o.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {pageSlice.map(o => {
            const st   = STATUS[o.status] || { label: o.status, color: 'bg-gray-100 text-gray-500' }
            const addr = o.customer_address || {}
            return (
              <div key={o.id} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{o.customer_name || '—'}</p>
                    <p className="text-xs text-gray-400">{o.customer_email || ''}</p>
                    <p className="text-xs text-gray-400">{o.customer_phone || ''}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                    {o.status === 'pending' && (
                      <button
                        onClick={() => syncOrder(o)}
                        disabled={syncing[o.id]}
                        title="Verificar no Mercado Pago"
                        className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 transition-colors"
                      >
                        <RotateCcw className={`h-3.5 w-3.5 ${syncing[o.id] ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{o.kit_name || '—'}</span>
                  <span className="font-bold text-gray-900">{fmt(o.total_amount)}</span>
                </div>
                {addr.city && (
                  <p className="text-xs text-gray-400">{addr.street}, {addr.number} · {addr.city}/{addr.state}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-50">
                  <span>{o.shipping_name || ''} {o.shipping_cost ? `· ${fmt(o.shipping_cost)}` : ''}</span>
                  <span>{fmtDate(o.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
            </p>
            <div className="flex gap-1 items-center">
              <button onClick={() => changePage(page - 1)} disabled={page === 0} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-xs text-gray-600 font-medium">{page + 1} / {totalPages}</span>
              <button onClick={() => changePage(page + 1)} disabled={page >= totalPages - 1} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  )
}
