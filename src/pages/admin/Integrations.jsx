import { useState, useEffect } from 'react'
import { Save, CheckCircle2, AlertCircle, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { getCompanyId } from '@/lib/company'

const INTEGRATIONS = [
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
    ],
    docs: 'https://docs.melhorenvio.com.br',
    badge: 'Frete',
  },
  {
    key: 'bling',
    name: 'Bling',
    description: 'Emitir NF-e série 03 direto no painel de pedidos.',
    fields: [
      { key: 'access_token', label: 'API Token (v3)', secret: true, placeholder: 'Token de acesso Bling v3' },
      { key: 'nfe_serie', label: 'Série da NF-e', placeholder: '3' },
      { key: 'forma_pagamento_id', label: 'ID Forma de Pagamento', placeholder: 'ID cadastrado no Bling' },
    ],
    docs: 'https://developer.bling.com.br/referencia',
    badge: 'NF-e',
  },
]

function IntegrationCard({ integration }) {
  const [form,    setForm]    = useState({})
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [alert,   setAlert]   = useState(null)
  const [show,    setShow]    = useState({})

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
          .single()
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
      const payload = {
        marketplace: integration.key,
        company_id: cid,
        access_token: access_token || '',
        extra_data,
        is_active: true,
      }

      const { data: existing } = await supabase
        .from('marketplace_credentials')
        .select('id')
        .eq('marketplace', integration.key)
        .eq('company_id', cid)
        .limit(1)
        .single()

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

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))
  const isConfigured = !!form.access_token

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

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
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
        <IntegrationCard key={integration.key} integration={integration} />
      ))}
    </div>
  )
}
