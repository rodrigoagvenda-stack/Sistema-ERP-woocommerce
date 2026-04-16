import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const DEFAULT_FORM = {
  name:             '',
  logo_url:         '',
  favicon_url:      '',
  primary_color:    '#15A344',
  whatsapp_number:  '',
  feature_payments: false,
  feature_shipping: false,
  feature_coupons:  false,
  feature_site:     false,
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-800 last:border-0">
      <div>
        <p className="text-sm text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
          checked ? 'bg-green-500' : 'bg-gray-700'
        }`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-4.5' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  )
}

function Field({ label, description, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-gray-300">
        {label}
        {description && <span className="ml-1.5 text-xs text-gray-500 font-normal">{description}</span>}
      </Label>
      {children}
    </div>
  )
}

export default function CompanyEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const [form, setForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isNew) return
    supabase.from('companies').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error) { setError('Empresa não encontrada'); return }
      setForm({ ...DEFAULT_FORM, ...data })
      setLoading(false)
    })
  }, [id, isNew])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      if (isNew) {
        const { error } = await supabase.from('companies').insert([form])
        if (error) throw error
      } else {
        const { error } = await supabase.from('companies').update(form).eq('id', id)
        if (error) throw error
      }
      navigate('/super-admin/companies')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500 text-sm">Carregando...</div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
          onClick={() => navigate('/super-admin/companies')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-white">
            {isNew ? 'Nova empresa' : `Editar — ${form.name}`}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Branding e serviços disponíveis</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Informações */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Informações</p>
        <Field label="Nome da empresa">
          <Input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Ex: Geezer Cervejas"
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus-visible:ring-gray-600"
          />
        </Field>
        <Field label="Número WhatsApp" description="Com DDI — ex: 5511999999999">
          <Input
            value={form.whatsapp_number}
            onChange={e => set('whatsapp_number', e.target.value)}
            placeholder="5511999999999"
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus-visible:ring-gray-600"
          />
        </Field>
      </section>

      {/* Branding */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Identidade visual</p>

        <Field label="URL do logo">
          <Input
            value={form.logo_url}
            onChange={e => set('logo_url', e.target.value)}
            placeholder="https://..."
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus-visible:ring-gray-600"
          />
          {form.logo_url && (
            <div className="mt-2 w-32 h-12 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden p-2">
              <img src={form.logo_url} alt="preview" className="max-h-full max-w-full object-contain" />
            </div>
          )}
        </Field>

        <Field label="URL do favicon">
          <Input
            value={form.favicon_url}
            onChange={e => set('favicon_url', e.target.value)}
            placeholder="https://..."
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus-visible:ring-gray-600"
          />
          {form.favicon_url && (
            <div className="mt-2 w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden p-1">
              <img src={form.favicon_url} alt="favicon" className="max-h-full max-w-full object-contain" />
            </div>
          )}
        </Field>

        <Field label="Cor principal">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.primary_color}
              onChange={e => set('primary_color', e.target.value)}
              className="h-9 w-16 rounded-md border border-gray-700 bg-gray-800 cursor-pointer p-1"
            />
            <Input
              value={form.primary_color}
              onChange={e => set('primary_color', e.target.value)}
              className="w-32 bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus-visible:ring-gray-600 font-mono"
            />
          </div>
        </Field>
      </section>

      {/* Serviços */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Serviços</p>
        <p className="text-xs text-gray-500 mb-4">Define quais módulos aparecem no menu do cliente</p>
        <Toggle
          label="Formas de Pagamento"
          description="Gestão de gateways WooCommerce"
          checked={form.feature_payments}
          onChange={v => set('feature_payments', v)}
        />
        <Toggle
          label="Frete"
          description="Zonas e métodos de entrega"
          checked={form.feature_shipping}
          onChange={v => set('feature_shipping', v)}
        />
        <Toggle
          label="Cupons"
          description="Gestão de cupons de desconto"
          checked={form.feature_coupons}
          onChange={v => set('feature_coupons', v)}
        />
        <Toggle
          label="Site — Nossas Cervejas"
          description="Slider de produtos no site"
          checked={form.feature_site}
          onChange={v => set('feature_site', v)}
        />
      </section>

      {/* Save */}
      <div className="flex justify-end pb-6">
        <Button
          onClick={handleSave}
          disabled={saving || !form.name}
          className="gap-2 bg-white text-gray-900 hover:bg-gray-100"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}
