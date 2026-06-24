import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, TrendingUp, CheckCircle2, Clock, XCircle, ChevronLeft, ChevronRight, Gift } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { getCompanyId } from '@/lib/company'
import { mercadoPagoProxy, pagbankProxy } from '@/lib/api'

const fmt     = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
const fmtDate = (d) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

const PAGE_SIZE = 20

const MP_STATUS = {
  approved:   { label: 'Aprovado',    color: 'bg-green-100 text-green-700' },
  pending:    { label: 'Pendente',    color: 'bg-yellow-100 text-yellow-700' },
  in_process: { label: 'Em análise', color: 'bg-blue-100 text-blue-700' },
  rejected:   { label: 'Rejeitado',  color: 'bg-red-100 text-red-700' },
  cancelled:  { label: 'Cancelado',  color: 'bg-gray-100 text-gray-500' },
  refunded:   { label: 'Reembolsado',color: 'bg-purple-100 text-purple-700' },
}

const PB_STATUS = {
  PAID:        { label: 'Pago',       color: 'bg-green-100 text-green-700' },
  WAITING:     { label: 'Aguardando', color: 'bg-yellow-100 text-yellow-700' },
  IN_ANALYSIS: { label: 'Em análise', color: 'bg-blue-100 text-blue-700' },
  DECLINED:    { label: 'Recusado',   color: 'bg-red-100 text-red-700' },
  CANCELED:    { label: 'Cancelado',  color: 'bg-gray-100 text-gray-500' },
}

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


function PaymentTable({ rows, kitMap = {}, pagination }) {
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3">ID</th>
            <th className="text-left px-4 py-3">Cliente</th>
            <th className="text-left px-4 py-3">Kit</th>
            <th className="text-left px-4 py-3">Método</th>
            <th className="text-right px-4 py-3">Valor</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-left px-4 py-3">Data</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((r, i) => {
            const kitName = kitMap[String(r.id)]
            return (
              <tr key={r.id ?? i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-400 font-mono">{String(r.id).slice(0, 12)}…</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{r.name || '—'}</p>
                  <p className="text-xs text-gray-400">{r.email || ''}</p>
                </td>
                <td className="px-4 py-3">
                  {kitName ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
                      <Gift className="h-2.5 w-2.5" />{kitName}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{r.method || '—'}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmt(r.amount)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r.statusColor}`}>{r.statusLabel}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(r.date)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400">{pagination.label}</p>
          <div className="flex gap-1 items-center">
            <button onClick={() => pagination.onChange(pagination.page - 1)} disabled={pagination.page === 0} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-xs text-gray-600 font-medium">{pagination.page + 1} / {pagination.totalPages}</span>
            <button onClick={() => pagination.onChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages - 1} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const DATE_PRESETS = [
  { label: '7 dias',      days: 7  },
  { label: '30 dias',     days: 30 },
  { label: '90 dias',     days: 90 },
  { label: '6 meses',     days: 180 },
]

function MPDashboard() {
  const [payments, setPayments] = useState([])
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [kitMap,   setKitMap]   = useState({})
  const [days,     setDays]     = useState(30)

  const load = useCallback(async (p = 0, d = 30) => {
    setLoading(true); setError(null)
    try {
      const begin  = new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString()
      const offset = p * PAGE_SIZE
      const [data, cid] = await Promise.all([
        mercadoPagoProxy({ endpoint: `v1/payments/search?sort=date_created&criteria=desc&limit=${PAGE_SIZE}&offset=${offset}&begin_date=${begin}` }),
        getCompanyId(),
      ])
      setPayments(data?.results || [])
      setTotal(data?.paging?.total || 0)
      setPage(p)

      if (p === 0) {
        const { data: kits } = await supabase
          .from('kit_orders')
          .select('mp_payment_id, kit_name')
          .eq('company_id', cid)
          .not('mp_payment_id', 'is', null)
        const map = {}
        ;(kits || []).forEach(k => { map[String(k.mp_payment_id)] = k.kit_name })
        setKitMap(map)
      }
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(0, days) }, [load])

  const changePreset = (d) => { setDays(d); load(0, d) }

  const approved = payments.filter(p => p.status === 'approved')
  const pending  = payments.filter(p => ['pending', 'in_process'].includes(p.status))
  const rejected = payments.filter(p => ['rejected', 'cancelled'].includes(p.status))
  const revenue  = approved.reduce((s, p) => s + (p.transaction_amount || 0), 0)

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const rows = payments.map(p => {
    const st = MP_STATUS[p.status] || { label: p.status, color: 'bg-gray-100 text-gray-500' }
    return {
      id:          p.id,
      name:        p.payer?.first_name ? `${p.payer.first_name} ${p.payer.last_name || ''}`.trim() : (p.payer?.email || '—'),
      email:       p.payer?.email || '',
      method:      (p.payment_type_id || '').replace(/_/g, ' '),
      amount:      p.transaction_amount,
      statusLabel: st.label,
      statusColor: st.color,
      date:        p.date_created,
    }
  })

  const paginationProps = totalPages > 1 ? {
    page, totalPages,
    label: `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} de ${total}`,
    onChange: (p) => load(p, days),
  } : null

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Financeiro — Mercado Pago</h1>
          <p className="text-sm text-gray-400">{total} transações no período</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {DATE_PRESETS.map(pr => (
              <button key={pr.days} onClick={() => changePreset(pr.days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${days === pr.days ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {pr.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => load(0, days)} disabled={loading} className="gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={TrendingUp}   label="Receita aprovada" value={fmt(revenue)}     color="bg-green-100 text-green-600" />
        <SummaryCard icon={CheckCircle2} label="Aprovados"        value={approved.length}  color="bg-green-100 text-green-600" />
        <SummaryCard icon={Clock}        label="Pendentes"        value={pending.length}   color="bg-yellow-100 text-yellow-600" />
        <SummaryCard icon={XCircle}      label="Rejeitados"       value={rejected.length}  color="bg-red-100 text-red-600" />
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 text-center py-12">Carregando...</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-12">Nenhum pagamento no período selecionado.</div>
      ) : (
        <PaymentTable rows={rows} kitMap={kitMap} pagination={paginationProps} />
      )}
    </div>
  )
}

function PBDashboard() {
  const [charges, setCharges] = useState([])
  const [page,    setPage]    = useState(0)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await pagbankProxy({ endpoint: 'charges?limit=200' })
      setCharges(data?.charges || [])
      setPage(0)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const paid     = charges.filter(c => c.status === 'PAID')
  const pending  = charges.filter(c => ['WAITING', 'IN_ANALYSIS'].includes(c.status))
  const declined = charges.filter(c => ['DECLINED', 'CANCELED'].includes(c.status))
  const revenue  = paid.reduce((s, c) => s + ((c.amount?.value || 0) / 100), 0)

  const totalPages = Math.ceil(charges.length / PAGE_SIZE)
  const pageSlice  = charges.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const rows = pageSlice.map(c => {
    const st = PB_STATUS[c.status] || { label: c.status, color: 'bg-gray-100 text-gray-500' }
    return {
      id: c.id, name: c.description || '—', email: '',
      method: c.payment_method?.type || '—',
      amount: (c.amount?.value || 0) / 100,
      statusLabel: st.label, statusColor: st.color, date: c.created_at,
    }
  })

  const paginationProps = totalPages > 1 ? {
    page, totalPages,
    label: `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, charges.length)} de ${charges.length}`,
    onChange: setPage,
  } : null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Financeiro — PagBank</h1>
          <p className="text-sm text-gray-400">{charges.length} transações</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {error && <div className="text-sm text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={TrendingUp}   label="Receita paga"  value={fmt(revenue)}    color="bg-green-100 text-green-600" />
        <SummaryCard icon={CheckCircle2} label="Pagos"         value={paid.length}     color="bg-green-100 text-green-600" />
        <SummaryCard icon={Clock}        label="Pendentes"     value={pending.length}  color="bg-yellow-100 text-yellow-600" />
        <SummaryCard icon={XCircle}      label="Recusados"     value={declined.length} color="bg-red-100 text-red-600" />
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 text-center py-12">Carregando...</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-12">Nenhuma cobrança encontrada.</div>
      ) : (
        <PaymentTable rows={rows} pagination={paginationProps} />
      )}
    </div>
  )
}

export default function Financeiro() {
  const [gateways, setGateways] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState(null)

  useEffect(() => {
    const check = async () => {
      try {
        const cid = await getCompanyId()
        const { data } = await supabase
          .from('marketplace_credentials')
          .select('marketplace')
          .in('marketplace', ['mercadopago', 'pagbank'])
          .eq('company_id', cid)
          .eq('is_active', true)
        const list = (data || []).map(r => r.marketplace)
        setGateways(list)
        setTab(list[0] || null)
      } catch {}
      finally { setLoading(false) }
    }
    check()
  }, [])

  if (loading) return <div className="text-sm text-gray-400 text-center py-16">Verificando integrações...</div>

  if (gateways.length === 0) {
    return (
      <div className="text-center py-16 space-y-2">
        <p className="text-gray-500 font-medium">Nenhum gateway configurado.</p>
        <p className="text-sm text-gray-400">Acesse <strong>Integrações</strong> e configure o Mercado Pago ou PagBank.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {gateways.length > 1 && (
        <div className="flex gap-2">
          {gateways.includes('mercadopago') && (
            <button onClick={() => setTab('mercadopago')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === 'mercadopago' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Mercado Pago
            </button>
          )}
          {gateways.includes('pagbank') && (
            <button onClick={() => setTab('pagbank')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === 'pagbank' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              PagBank
            </button>
          )}
        </div>
      )}
      {tab === 'mercadopago' && <MPDashboard />}
      {tab === 'pagbank'     && <PBDashboard />}
    </div>
  )
}
