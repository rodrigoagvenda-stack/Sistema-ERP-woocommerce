import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Upload, X, ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const DEFAULT_FORM = {
  name:             '',
  slug:             '',
  primary_color:    '#15A344',
  whatsapp_number:  '',
  logo_url:         '',
  favicon_url:      '',
  feature_payments: false,
  feature_shipping: false,
  feature_coupons:  false,
  feature_site:     false,
  has_woocommerce:  true,
}

// ── File Upload Zone ──────────────────────────────────────────────────────────
function UploadZone({ label, value, onChange, accept = 'image/*', square = false }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file) => {
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('company-assets')
      .upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('company-assets').getPublicUrl(path)
      onChange(data.publicUrl)
    }
    setUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-gray-400">{label}</p>
      <div
        className={`relative group border border-dashed border-gray-700 rounded-xl bg-gray-800/50 hover:bg-gray-800 hover:border-gray-600 transition-all cursor-pointer overflow-hidden
          ${square ? 'w-20 h-20' : 'h-24'}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        {value ? (
          <>
            <img
              src={value}
              alt=""
              className="w-full h-full object-contain p-3"
            />
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange('') }}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-900/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1.5 text-gray-600">
            {uploading
              ? <div className="w-4 h-4 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
              : <>
                  <Upload className="w-4 h-4" />
                  <span className="text-[11px]">Clique ou arraste</span>
                </>
            }
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>
    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-800/80 last:border-0">
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
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  )
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-gray-400 flex items-center gap-2">
        {label}
        {hint && <span className="text-gray-600 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, mono = false }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full h-9 px-3 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-500 transition-colors ${mono ? 'font-mono' : ''}`}
    />
  )
}

// ── Editor ────────────────────────────────────────────────────────────────────
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
      const payload = {
        name:             form.name,
        slug:             form.slug,
        primary_color:    form.primary_color,
        whatsapp_number:  form.whatsapp_number,
        logo_url:         form.logo_url,
        favicon_url:      form.favicon_url,
        feature_payments: form.feature_payments,
        feature_shipping: form.feature_shipping,
        feature_coupons:  form.feature_coupons,
        feature_site:     form.feature_site,
        has_woocommerce:  form.has_woocommerce,
      }
      if (isNew) {
        const { error } = await supabase.from('companies').insert([payload])
        if (error) throw error
      } else {
        const { error } = await supabase.from('companies').update(payload).eq('id', id)
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
      <div className="flex items-center justify-center py-24">
        <div className="w-5 h-5 border-2 border-gray-700 border-t-gray-400 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-6 pb-10">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/super-admin/companies')}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Gestão</p>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            {isNew ? 'Nova empresa' : form.name || 'Editar empresa'}
          </h1>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Informações */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
        <div className="px-5 py-3.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Informações</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          <Field label="Nome da empresa">
            <TextInput
              value={form.name}
              onChange={v => set('name', v)}
              placeholder="Ex: Geezer Cervejas"
            />
          </Field>
          <Field label="Slug" hint="usado na URL de login — ex: geezer">
            <TextInput
              value={form.slug}
              onChange={v => set('slug', v.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="geezer"
              mono
            />
          </Field>
          <Field label="WhatsApp" hint="com DDI — ex: 5511999999999">
            <TextInput
              value={form.whatsapp_number}
              onChange={v => set('whatsapp_number', v)}
              placeholder="5511999999999"
              mono
            />
          </Field>
        </div>
      </section>

      {/* Identidade visual */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
        <div className="px-5 py-3.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Identidade visual</p>
        </div>
        <div className="px-5 py-4 space-y-5">

          {/* Logo + Favicon lado a lado */}
          <div className="flex gap-6">
            <UploadZone
              label="Logo"
              value={form.logo_url}
              onChange={v => set('logo_url', v)}
            />
            <UploadZone
              label="Favicon"
              value={form.favicon_url}
              onChange={v => set('favicon_url', v)}
              square
            />
          </div>

          {/* Cor */}
          <Field label="Cor principal">
            <div className="flex items-center gap-3">
              <label className="relative cursor-pointer">
                <div
                  className="w-9 h-9 rounded-lg border border-gray-700 cursor-pointer"
                  style={{ backgroundColor: form.primary_color }}
                />
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={e => set('primary_color', e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
              <input
                type="text"
                value={form.primary_color}
                onChange={e => set('primary_color', e.target.value)}
                className="w-28 h-9 px-3 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white font-mono focus:outline-none focus:border-gray-500 transition-colors"
              />
            </div>
          </Field>
        </div>
      </section>

      {/* Módulos */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
        <div className="px-5 py-3.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Módulos</p>
        </div>
        <div className="px-5">
          <Toggle
            label="WooCommerce"
            description="Empresa integrada ao WooCommerce"
            checked={form.has_woocommerce}
            onChange={v => set('has_woocommerce', v)}
          />
          <Toggle
            label="Formas de Pagamento"
            description="Gestão de gateways e métodos"
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
            description="Cupons de desconto WooCommerce"
            checked={form.feature_coupons}
            onChange={v => set('feature_coupons', v)}
          />
          <Toggle
            label="Site — Nossas Cervejas"
            description="Slider de produtos no site"
            checked={form.feature_site}
            onChange={v => set('feature_site', v)}
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => navigate('/super-admin/companies')}
          className="text-sm text-gray-500 hover:text-white transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !form.name}
          className="flex items-center gap-2 px-5 py-2 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

    </div>
  )
}
