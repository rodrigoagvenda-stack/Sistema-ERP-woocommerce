import { useState, useEffect } from 'react'
import { Save, TestTube2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { api, wooProxy } from '@/lib/api'

export default function WooSettings() {
  const [form, setForm] = useState({
    store_url: '', consumer_key: '', consumer_secret: '',
    is_active: true, auto_sync_stock: true, auto_sync_price: false, auto_sync_products: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [alert, setAlert] = useState(null)
  const [showKey, setShowKey] = useState(false)
  const [showSecret, setShowSecret] = useState(false)

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 5000)
  }

  useEffect(() => {
    api.getWooCredentials()
      .then(d => { if (d) setForm(f => ({ ...f, ...d })) })
      .catch(e => showAlert('error', e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!form.store_url?.trim()) return showAlert('error', 'URL da loja é obrigatória')
    if (!form.consumer_key?.trim()) return showAlert('error', 'Consumer Key é obrigatória')
    if (!form.consumer_secret?.trim()) return showAlert('error', 'Consumer Secret é obrigatório')
    setSaving(true)
    try {
      await api.upsertWooCredentials({
        store_url: form.store_url.trim(),
        consumer_key: form.consumer_key.trim(),
        consumer_secret: form.consumer_secret.trim(),
        is_active: form.is_active,
        auto_sync_stock: form.auto_sync_stock,
        auto_sync_price: form.auto_sync_price,
        auto_sync_products: form.auto_sync_products,
      })
      showAlert('success', 'Configurações do WooCommerce salvas com sucesso!')
    } catch (e) {
      showAlert('error', 'Erro ao salvar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!form.store_url || !form.consumer_key || !form.consumer_secret) {
      return showAlert('error', 'Preencha as credenciais antes de testar')
    }
    setTesting(true)
    try {
      const result = await wooProxy({
        endpoint: 'system_status',
        credentials: {
          store_url: form.store_url.trim(),
          consumer_key: form.consumer_key.trim(),
          consumer_secret: form.consumer_secret.trim(),
        }
      })
      showAlert('success', `Conexão bem-sucedida! WooCommerce v${result?.environment?.version || '?'} em ${form.store_url}`)
    } catch (e) {
      showAlert('error', 'Falha na conexão: ' + e.message)
    } finally {
      setTesting(false)
    }
  }

  const Toggle = ({ field, label }) => (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => setForm(f => ({ ...f, [field]: !f[field] }))}
        className={`relative w-10 h-5 rounded-full transition-colors ${form[field] ? '[background-color:var(--brand)]' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form[field] ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </label>
  )

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configurações WooCommerce</h1>
        <p className="text-sm text-gray-500">Conecte o sistema à sua loja WooCommerce</p>
      </div>

      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'success'}>
          {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Credenciais da API
            {form.is_active && form.store_url && <Badge variant="success">Ativo</Badge>}
          </CardTitle>
          <CardDescription>
            Gere as chaves em: WooCommerce → Configurações → Avançado → API REST → Adicionar Chave
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>URL da Loja *</Label>
            <Input
              value={form.store_url}
              onChange={e => setForm(f => ({ ...f, store_url: e.target.value }))}
              placeholder="https://minhaloja.com.br"
            />
            <p className="text-xs text-gray-400">URL raiz do WordPress. Não inclua /loja ou /shop.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Consumer Key *</Label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={form.consumer_key}
                onChange={e => setForm(f => ({ ...f, consumer_key: e.target.value }))}
                placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="pr-10"
              />
              <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Consumer Secret *</Label>
            <div className="relative">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={form.consumer_secret}
                onChange={e => setForm(f => ({ ...f, consumer_secret: e.target.value }))}
                placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="pr-10"
              />
              <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing} className="gap-2">
              <TestTube2 className="h-4 w-4" />
              {testing ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sincronização Automática</CardTitle>
          <CardDescription>O que deve ser sincronizado automaticamente</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          <Toggle field="auto_sync_stock" label="Sincronizar estoque automaticamente" />
          <Toggle field="auto_sync_price" label="Sincronizar preço automaticamente" />
          <Toggle field="auto_sync_products" label="Publicar novos produtos automaticamente" />
          <Toggle field="is_active" label="Integração ativa" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Como gerar as credenciais</h3>
          <ol className="text-sm text-gray-500 space-y-1.5 list-decimal list-inside">
            <li>Acesse o painel do WordPress</li>
            <li>Vá em WooCommerce → Configurações → Avançado → API REST</li>
            <li>Clique em "Adicionar chave"</li>
            <li>Defina a permissão como "Leitura/Gravação"</li>
            <li>Clique em "Gerar chave API"</li>
            <li>Copie o Consumer Key e Consumer Secret</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
