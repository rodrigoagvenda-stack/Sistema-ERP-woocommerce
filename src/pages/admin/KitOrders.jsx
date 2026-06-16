import { useState, useEffect } from 'react'
import { RefreshCw, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { getCompanyId } from '@/lib/company'

const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
const fmtDate = (d) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

const STATUS = {
  pending:   { label: 'Pendente',   color: 'bg-yellow-100 text-yellow-700' },
  approved:  { label: 'Aprovado',   color: 'bg-green-100 text-green-700'  },
  rejected:  { label: 'Rejeitado',  color: 'bg-red-100 text-red-700'      },
  cancelled: { label: 'Cancelado',  color: 'bg-gray-100 text-gray-500'    },
  refunded:  { label: 'Reembolsado',color: 'bg-purple-100 text-purple-700'},
}

export default function KitOrders() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const cid = await getCompanyId()
      const { data } = await supabase
        .from('kit_orders')
        .select('*')
        .eq('company_id', cid)
        .order('created_at', { ascending: false })
        .limit(200)
      setOrders(data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const approved  = orders.filter(o => o.status === 'approved')
  const revenue   = approved.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pedidos de Kit</h1>
          <p className="text-sm text-gray-400">{orders.length} pedidos · {approved.length} aprovados · {fmt(revenue)} em receita</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 text-center py-16">Carregando pedidos...</div>
      ) : orders.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-16">Nenhum pedido ainda.</div>
      ) : (
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Kit</th>
                <th className="text-left px-4 py-3">Frete</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Pagamento</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(o => {
                const st = STATUS[o.status] || { label: o.status, color: 'bg-gray-100 text-gray-500' }
                return (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{o.customer_name || '—'}</p>
                      <p className="text-xs text-gray-400">{o.customer_email || ''}</p>
                      <p className="text-xs text-gray-400">{o.customer_phone || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{o.kit_name || '—'}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{fmt(o.shipping_cost)}</p>
                      {o.shipping_name && <p className="text-xs text-gray-400">{o.shipping_name}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmt(o.total_amount)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{o.payment_method || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(o.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
