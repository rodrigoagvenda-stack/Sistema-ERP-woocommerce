import { useState, useEffect } from 'react'
import { Save, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'

export default function AnalyticsSettings() {
  const [form, setForm] = useState({ default_period: 30, revenue_goal: 0, low_stock_threshold: 5, sync_interval: 10 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  useEffect(() => {
    api.getAnalyticsSettings()
      .then(s => setForm(s))
      .catch(e => showAlert('error', e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateAnalyticsSettings(form)
      showAlert('success', 'Configurações de analytics salvas!')
    } catch (e) {
      showAlert('error', 'Erro ao salvar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configurações de Analytics</h1>
        <p className="text-sm text-gray-500">Ajuste as preferências de visualização de dados</p>
      </div>

      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'success'}>
          {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferências</CardTitle>
          <CardDescription>Configurações padrão para os relatórios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label>Período padrão</Label>
            <Select value={form.default_period?.toString()} onValueChange={v => setForm(p => ({ ...p, default_period: parseInt(v) }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Meta de faturamento mensal (R$)</Label>
            <Input
              type="number"
              step="100"
              min="0"
              value={form.revenue_goal}
              onChange={e => setForm(p => ({ ...p, revenue_goal: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
            />
            <p className="text-xs text-gray-400">Usado para exibir progresso em relação à meta</p>
          </div>

          <div className="space-y-1.5">
            <Label>Threshold de estoque baixo (unidades)</Label>
            <Input
              type="number"
              min="0"
              value={form.low_stock_threshold}
              onChange={e => setForm(p => ({ ...p, low_stock_threshold: parseInt(e.target.value) || 0 }))}
            />
            <p className="text-xs text-gray-400">Produtos abaixo deste número serão marcados como "estoque baixo"</p>
          </div>

          <div className="space-y-1.5">
            <Label>Intervalo de sincronização (minutos)</Label>
            <Select value={form.sync_interval?.toString()} onValueChange={v => setForm(p => ({ ...p, sync_interval: parseInt(v) }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutos</SelectItem>
                <SelectItem value="10">10 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">Com que frequência os dados devem ser atualizados</p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2 w-full">
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
