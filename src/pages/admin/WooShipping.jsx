import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, RefreshCw, MapPin, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { wooProxy } from '@/lib/api'

function AlertMsg({ alert }) {
  if (!alert) return null
  return (
    <Alert variant={alert.type === 'error' ? 'destructive' : 'success'} className="mb-4">
      {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
      <AlertDescription>{alert.message}</AlertDescription>
    </Alert>
  )
}

function MethodRow({ method, zoneId, onToggle, saving }) {
  const key = `${zoneId}-${method.instance_id}`
  const isSaving = saving === key

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 px-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          <Truck className="h-4 w-4 text-gray-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {method.title || method.method_title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{method.method_id}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Badge variant={method.enabled ? 'success' : 'secondary'} className="text-xs">
          {method.enabled ? 'Ativo' : 'Inativo'}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggle(zoneId, method)}
          disabled={isSaving}
          className={method.enabled
            ? 'border-red-200 text-red-600 hover:bg-red-50'
            : 'border-green-200 text-green-600 hover:bg-green-50'
          }
        >
          {isSaving ? '...' : method.enabled ? 'Desativar' : 'Ativar'}
        </Button>
      </div>
    </div>
  )
}

function ZoneCard({ zone, onToggle, saving }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Zone header */}
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-[#f4b522]/10 flex items-center justify-center shrink-0">
            <MapPin className="h-4 w-4 text-[#c49018]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{zone.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {zone._methods?.length
                ? `${zone._methods.length} método${zone._methods.length !== 1 ? 's' : ''}`
                : 'Sem métodos'}
            </p>
          </div>
          <div className="shrink-0">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
          </div>
        </button>

        {/* Methods */}
        {expanded && zone._methods?.length > 0 && (
          <div className="border-t border-gray-100">
            {zone._methods.map(m => (
              <MethodRow
                key={m.instance_id}
                method={m}
                zoneId={zone.id}
                onToggle={onToggle}
                saving={saving}
              />
            ))}
          </div>
        )}

        {expanded && (!zone._methods || zone._methods.length === 0) && (
          <div className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
            Nenhum método de frete nesta zona
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function WooShipping() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [alert, setAlert] = useState(null)

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 5000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const zoneList = await wooProxy({ method: 'GET', endpoint: 'shipping/zones' })
      if (!Array.isArray(zoneList)) throw new Error('Resposta inválida')

      // Busca métodos de cada zona em paralelo
      const withMethods = await Promise.all(
        zoneList.map(async (zone) => {
          try {
            const methods = await wooProxy({ method: 'GET', endpoint: `shipping/zones/${zone.id}/methods` })
            return { ...zone, _methods: Array.isArray(methods) ? methods : [] }
          } catch {
            return { ...zone, _methods: [] }
          }
        })
      )

      setZones(withMethods)
    } catch (e) {
      showAlert('error', 'Erro ao carregar zonas de frete: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = async (zoneId, method) => {
    const key = `${zoneId}-${method.instance_id}`
    setSaving(key)
    try {
      const updated = await wooProxy({
        method: 'PUT',
        endpoint: `shipping/zones/${zoneId}/methods/${method.instance_id}`,
        body: { enabled: !method.enabled },
      })
      setZones(prev => prev.map(z =>
        z.id === zoneId
          ? { ...z, _methods: z._methods.map(m => m.instance_id === updated.instance_id ? updated : m) }
          : z
      ))
      showAlert('success', `${updated.title} ${updated.enabled ? 'ativado' : 'desativado'}!`)
    } catch (e) {
      showAlert('error', 'Erro ao atualizar: ' + e.message)
    } finally {
      setSaving(null)
    }
  }

  const activeMethods = zones.reduce((acc, z) => acc + (z._methods?.filter(m => m.enabled).length || 0), 0)
  const totalMethods = zones.reduce((acc, z) => acc + (z._methods?.length || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Frete</h1>
          <p className="text-sm text-gray-500">
            {loading ? 'Carregando...' : `${zones.length} zona${zones.length !== 1 ? 's' : ''} · ${activeMethods} de ${totalMethods} métodos ativos`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <AlertMsg alert={alert} />

      {!loading && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-700 text-xs">
            Para configurar o token do Melhor Envio, acesse o <strong>wp-admin → WooCommerce → Melhor Envio</strong> uma única vez. Após isso, ative os métodos desejados aqui.
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">
          Carregando zonas de frete do WooCommerce...
        </div>
      ) : zones.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">
          Nenhuma zona de frete encontrada. Verifique as credenciais do WooCommerce.
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map(z => (
            <ZoneCard
              key={z.id}
              zone={z}
              onToggle={handleToggle}
              saving={saving}
            />
          ))}
        </div>
      )}
    </div>
  )
}
