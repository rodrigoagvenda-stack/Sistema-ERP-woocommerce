import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Save, CheckCircle2, AlertCircle, Eye, EyeOff, RefreshCw, Wifi, Link } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { getCompanyId } from '@/lib/company'
import { mercadoPagoProxy, pagbankProxy, melhorEnvioProxy } from '@/lib/api'
import { ENV } from '@/config/env'

const TEST_FNS = {
  mercadopago: () => mercadoPagoProxy({ endpoint: 'v1/payment_methods' }),
  pagbank:     () => pagbankProxy({ endpoint: 'public-keys/card' }),
  melhorenvio: () => melhorEnvioProxy({ endpoint: '' }),
}

const INTEGRATIONS = [
  {
    key: 'mercadopago',
    name: 'Mercado Pago',
    description: 'Verificar pagamentos e processar reembolsos direto no painel de pedidos.',
    fields: [
      { key: 'access_token', label: 'Access Token', secret: true, placeholder: 'APP_USR-...' },
    ],
    docs: 'https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/your-integrations/credentials',
    badge: 'Pagamentos',
  },
  {
    key: 'pagbank',
    name: 'PagBank',
    description: 'Verificar pagamentos e reembolsos direto no painel de pedidos.',
    fields: [
      { key: 'access_token', label: 'Access Token', secret: true, placeholder: 'Bearer token da API PagBank' },
    ],
    docs: 'https://dev.pagbank.uol.com.br/reference/autenticacao',
    badge: 'Pagamentos',
  },
  {
    key: 'melhorenvio',
    name: 'Melhor Envio',
    description: 'Gerar etiquetas e rastrear envios direto no painel de pedidos.',
    fields: [
      { key: 'access_token', label: 'Access Token', secret: true, placeholder: 'Token OAuth do Melhor Envio' },
      { key: 'sender_name', label: 'Nome do remetente', placeholder: 'Geezer Cervejaria' },
      { key: 'sender_email', label: 'E-mail do remetente', placeholder: 'contato@geezer.com.br' },
      { key: 'sender_document', label: 'CNPJ do remetente', placeholder: '00.000.000/0000-00' },
      { key: 'sender_phone', label: 'Telefone do remetente', placeholder: '(14) 99999-9999' },
      { key: 'sender_address', label: 'Endereço', placeholder: 'Rua Exemplo' },
      { key: 'sender_number', label: 'Número', placeholder: '100' },
      { key: 'sender_complement', label: 'Complemento', placeholder: 'Sala 1' },
      { key: 'sender_district', label: 'Bairro', placeholder: 'Centro' },
      { key: 'sender_city', label: 'Cidade', placeholder: 'Botucatu' },
      { key: 'sender_state', label: 'Estado (UF)', placeholder: 'SP' },
      { key: 'sender_cep', label: 'CEP', placeholder: '18600-000' },
      { key: 'default_service', label: 'Serviço fallback (opcional)', placeholder: '1 = PAC, 2 = SEDEX, 3 = JadLog — usado só se não detectar pelo pedido' },
      { key: 'default_weight', label: 'Peso padrão (kg)', placeholder: '0.5' },
      { key: 'allowed_carriers', label: 'Transportadoras permitidas (opcional)', placeholder: 'jadlog, correios, total express — deixe vazio para exibir todas' },
    ],
    docs: 'https://docs.melhorenvio.com.br',
    badge: 'Frete',
  },
  {
    key: 'bling',
    name: 'Bling',
    description: 'Emitir NF-e série 03 direto no painel de pedidos.',
    fields: [
      { key: 'client_id',          label: 'Client ID',              placeholder: 'Client ID do app Bling' },
      { key: 'client_secret',      label: 'Client Secret',          secret: true, placeholder: 'Client Secret do app Bling' },
      { key: 'nfe_serie',  label: 'Série da NF-e', placeholder: '3' },
      { key: 'fp_pix',    label: 'ID Bling → Pix',    placeholder: 'Ex: 10297923' },
      { key: 'fp_boleto', label: 'ID Bling → Boleto',  placeholder: 'Ex: 10297924' },
      { key: 'fp_cartao', label: 'ID Bling → Cartão',  placeholder: 'Ex: 10297925' },
    ],
    docs: 'https://developer.bling.com.br/referencia',
    badge: 'NF-e',
    oauth: true,
  },
]

function IntegrationCard({ integration, blingCode }) {
  const [form,        setForm]        = useState({})
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [testing,     setTesting]     = useState(false)
  const [connecting,  setConnecting]  = useState(false)
  const [connected,   setConnected]   = useState(false)
  const [alert,       setAlert]       = useState(null)
  const [show,        setShow]        = useState({})

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 5000)
  }

  useEffect(() => {
    const load = async () => {
      try {
        const cid = await getCompanyId()
        const { data } = await supabase
          .from('marketplace_credentials')
          .select('*')
          .eq('marketplace', integration.key)
          .eq('company_id', cid)
          .limit(1)
          .maybeSingle()
        if (data) {
          setForm({
            access_token: data.access_token || '',
            ...(data.extra_data || {}),
            is_active: data.is_active ?? true,
          })
        }
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const cid = await getCompanyId()
      const { access_token, is_active, ...extra_data } = form

      const { data: existing } = await supabase
        .from('marketplace_credentials')
        .select('id, access_token')
        .eq('marketplace', integration.key)
        .eq('company_id', cid)
        .limit(1)
        .maybeSingle()

      const payload = {
        marketplace: integration.key,
        company_id: cid,
        // preserva access_token existente se o form não tiver (OAuth)
        access_token: access_token || existing?.access_token || '',
        extra_data,
        is_active: true,
      }

      if (existing?.id) {
        const { error } = await supabase.from('marketplace_credentials').update(payload).eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('marketplace_credentials').insert(payload)
        if (error) throw error
      }

      showAlert('success', `${integration.name} configurado com sucesso!`)
    } catch (e) {
      showAlert('error', 'Erro ao salvar: ' + e.message)
    } finally {
      setSaving(false) }
  }

  const handleTest = async () => {
    const testFn = TEST_FNS[integration.key]
    if (!testFn) return
    setTesting(true)
    try {
      await testFn()
      showAlert('success', `Conexão com ${integration.name} OK! Token válido.`)
    } catch (e) {
      showAlert('error', `Falha na conexão: ${e.message}`)
    } finally {
      setTesting(false)
    }
  }

  // Troca código OAuth do Bling por access token
  useEffect(() => {
    if (integration.key !== 'bling' || !blingCode) return
    const exchange = async () => {
      setConnecting(true)
      try {
        const cid = await getCompanyId()
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(`${ENV.SUPABASE_URL}/functions/v1/bling-oauth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': ENV.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ company_id: cid, code: blingCode }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setConnected(true)
        showAlert('success', 'Bling conectado com sucesso! Token salvo.')
        // Atualiza form com o token
        setForm(prev => ({ ...prev, access_token: data.access_token }))
      } catch (e) {
        showAlert('error', 'Erro ao conectar Bling: ' + e.message)
      } finally {
        setConnecting(false)
        // Limpa o code da URL
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
    exchange()
  }, [blingCode, integration.key])

  const handleBlingConnect = () => {
    const clientId = form.client_id
    if (!clientId) return showAlert('error', 'Salve o Client ID primeiro.')
    const state = crypto.randomUUID()
    sessionStorage.setItem('bling_oauth_state', state)
    const url = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${clientId}&state=${state}`
    window.location.href = url
  }

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))
  const isConfigured = !!form.access_token
  const canTest = isConfigured && !!TEST_FNS[integration.key]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">{integration.name}</CardTitle>
            <Badge variant="secondary" className="text-xs">{integration.badge}</Badge>
            {isConfigured && <Badge variant="success" className="text-xs">Configurado</Badge>}
          </div>
          <a href={integration.docs} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
            Ver documentação →
          </a>
        </div>
        <CardDescription>{integration.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-gray-400 text-center py-4">Carregando...</div>
        ) : (
          <>
            {alert && (
              <Alert variant={alert.type === 'error' ? 'destructive' : 'success'}>
                {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {integration.fields.map(field => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs">{field.label}</Label>
                  <div className="relative">
                    <Input
                      type={field.secret && !show[field.key] ? 'password' : 'text'}
                      value={form[field.key] || ''}
                      onChange={e => set(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="text-sm pr-8"
                    />
                    {field.secret && (
                      <button
                        type="button"
                        onClick={() => setShow(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {show[field.key] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {canTest && (
                <Button variant="outline" onClick={handleTest} disabled={testing || saving} className="gap-2">
                  {testing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                  {testing ? 'Testando...' : 'Testar conexão'}
                </Button>
              )}
              {integration.oauth && (
                <Button variant="outline" onClick={handleBlingConnect} disabled={connecting || saving} className="gap-2">
                  {connecting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Link className="h-4 w-4" />}
                  {connecting ? 'Conectando...' : connected ? 'Reconectar Bling' : 'Conectar com Bling'}
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving || testing} className="gap-2">
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Salvando...' : 'Salvar configurações'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function Integrations() {
  const [searchParams] = useSearchParams()
  const blingCode = searchParams.get('bling_code')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Integrações</h1>
        <p className="text-sm text-gray-500">Configure as integrações para centralizar pagamentos, frete e NF-e no painel de pedidos.</p>
      </div>

      <Alert className="border-blue-100 bg-blue-50 text-blue-700">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Os tokens são armazenados de forma segura e usados apenas nas chamadas server-side (Edge Functions). Nunca são expostos no frontend.
        </AlertDescription>
      </Alert>

      {INTEGRATIONS.map(integration => (
        <IntegrationCard
          key={integration.key}
          integration={integration}
          blingCode={integration.key === 'bling' ? blingCode : null}
        />
      ))}
    </div>
  )
}
