import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

function SettingField({ setting, value, onChange }) {
  if (setting.type === 'title') return null
  if (setting.type === 'hidden') return null

  const label = (
    <Label className="text-sm font-medium text-gray-700">
      {setting.label}
      {setting.description && (
        <span className="ml-1 text-xs text-gray-400 font-normal">— {setting.description}</span>
      )}
    </Label>
  )

  if (setting.type === 'checkbox') {
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
        <Label className="text-sm text-gray-700 cursor-pointer">{setting.label}</Label>
        <button
          type="button"
          onClick={() => onChange(value === 'yes' ? 'no' : 'yes')}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value === 'yes' ? 'bg-green-500' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${value === 'yes' ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
        </button>
      </div>
    )
  }

  if (setting.type === 'select') {
    return (
      <div className="space-y-1.5">
        {label}
        <select
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f4b522]"
        >
          {Object.entries(setting.options || {}).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
    )
  }

  if (setting.type === 'textarea') {
    return (
      <div className="space-y-1.5">
        {label}
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          rows={3}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f4b522] resize-none"
        />
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {label}
      <Input
        type={setting.type === 'password' ? 'password' : 'text'}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function GatewayCard({ gateway, onToggle, onSave, saving }) {
  const [expanded, setExpanded] = useState(false)
  const [localSettings, setLocalSettings] = useState({})

  useEffect(() => {
    if (gateway.settings) {
      const initial = {}
      Object.entries(gateway.settings).forEach(([k, s]) => { initial[k] = s.value })
      setLocalSettings(initial)
    }
  }, [gateway.settings])

  const handleSave = () => {
    onSave(gateway, localSettings)
  }

  const settingEntries = Object.entries(gateway.settings || {}).filter(
    ([, s]) => s.type !== 'title' && s.type !== 'hidden'
  )

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center gap-4 p-4">
          {gateway.method_title && (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg shrink-0">
              💳
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 text-sm">{gateway.title || gateway.method_title}</p>
              <Badge variant={gateway.enabled ? 'success' : 'secondary'} className="text-xs">
                {gateway.enabled ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{gateway.method_description || gateway.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggle(gateway)}
              disabled={saving === gateway.id}
              className={gateway.enabled ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}
            >
              {saving === gateway.id ? '...' : gateway.enabled ? 'Desativar' : 'Ativar'}
            </Button>
            {settingEntries.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setExpanded(v => !v)}
              >
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Settings */}
        {expanded && settingEntries.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
            {settingEntries.map(([key, setting]) => (
              <SettingField
                key={key}
                setting={setting}
                value={localSettings[key] ?? setting.value}
                onChange={val => setLocalSettings(prev => ({ ...prev, [key]: val }))}
              />
            ))}
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={saving === gateway.id} size="sm">
                {saving === gateway.id ? 'Salvando...' : 'Salvar configurações'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function WooPayments() {
  const [gateways, setGateways] = useState([])
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
      const data = await wooProxy({ method: 'GET', endpoint: 'payment_gateways' })
      setGateways(Array.isArray(data) ? data : [])
    } catch (e) {
      showAlert('error', 'Erro ao carregar: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = async (gateway) => {
    setSaving(gateway.id)
    try {
      const updated = await wooProxy({
        method: 'PUT',
        endpoint: `payment_gateways/${gateway.id}`,
        body: { enabled: !gateway.enabled },
      })
      setGateways(prev => prev.map(g => g.id === updated.id ? updated : g))
      showAlert('success', `${updated.title} ${updated.enabled ? 'ativado' : 'desativado'}!`)
    } catch (e) {
      showAlert('error', 'Erro: ' + e.message)
    } finally {
      setSaving(null)
    }
  }

  const handleSave = async (gateway, settings) => {
    setSaving(gateway.id)
    try {
      const updated = await wooProxy({
        method: 'PUT',
        endpoint: `payment_gateways/${gateway.id}`,
        body: { settings },
      })
      setGateways(prev => prev.map(g => g.id === updated.id ? updated : g))
      showAlert('success', `Configurações de "${updated.title}" salvas!`)
    } catch (e) {
      showAlert('error', 'Erro ao salvar: ' + e.message)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Formas de Pagamento</h1>
          <p className="text-sm text-gray-500">Gerencie os gateways instalados no WooCommerce</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <AlertMsg alert={alert} />

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Carregando gateways do WooCommerce...</div>
      ) : gateways.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">
          Nenhum gateway encontrado. Verifique as credenciais do WooCommerce.
        </div>
      ) : (
        <div className="space-y-3">
          {gateways.map(g => (
            <GatewayCard
              key={g.id}
              gateway={g}
              onToggle={handleToggle}
              onSave={handleSave}
              saving={saving}
            />
          ))}
        </div>
      )}
    </div>
  )
}
