import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Search, CheckCircle2, AlertCircle, X, Upload, Globe, Download, Copy, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { api, wooProxy } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { getCompanyId } from '@/lib/company'
import { useCompany } from '@/context/CompanyContext'

const EMPTY_PRODUCT = {
  name: '', description: '', price: '', stock: '', min_stock: 5,
  category_id: '', subcategory_id: '', brand_id: '', status: 'active', image_urls: [],
  weight: '', width: '', height: '', depth: '', woo_tags: [], style: ''
}

const STEPS = [
  { n: 1, label: 'Básico' },
  { n: 2, label: 'Detalhes' },
  { n: 3, label: 'Mídia' },
]

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors
              ${step > s.n ? 'bg-green-500 text-white' : step === s.n ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {step > s.n ? '✓' : s.n}
            </div>
            <span className={`text-[10px] font-medium ${step === s.n ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-px mx-2 mb-4 ${step > s.n ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function ProductStepper({ step, setStep, current, setCurrent, categories, brands, styles, features, imageLoading, imageError, handleUploadImage, removeImage, saving, onSave, onCancel, isEdit }) {
  const set = (key, val) => setCurrent(p => ({ ...p, [key]: val }))

  return (
    <div>
      <StepIndicator step={step} />
      {imageError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <span className="mt-0.5 shrink-0">⚠️</span>
          <span>{imageError}</span>
        </div>
      )}

      {/* Step 1 — Básico */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={current.name} onChange={e => set('name', e.target.value)} placeholder="Nome do produto" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Preço (R$) *</Label>
              <Input type="number" step="0.01" value={current.price} onChange={e => set('price', e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Estoque</Label>
              <Input type="number" value={current.stock} onChange={e => set('stock', e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={current.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Estoque Mínimo</Label>
              <Input type="number" value={current.min_stock} onChange={e => set('min_stock', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Detalhes */}
      {step === 2 && (
        <div className="space-y-4">
          {!current.category_id && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <span>⚠️</span>
              <span>Lembre-se de vincular este produto a uma categoria para que ele seja sincronizado corretamente com o WooCommerce.</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={current.category_id?.toString() || 'none'} onValueChange={v => setCurrent(p => ({ ...p, category_id: v === 'none' ? null : v, subcategory_id: '' }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.filter(c => !c.parent_id).map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subcategoria</Label>
              <Select value={current.subcategory_id?.toString() || 'none'} onValueChange={v => set('subcategory_id', v === 'none' ? null : v)} disabled={!current.category_id}>
                <SelectTrigger><SelectValue placeholder={current.category_id ? 'Selecionar...' : 'Escolha a categoria'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem subcategoria</SelectItem>
                  {categories.filter(c => c.parent_id?.toString() === current.category_id?.toString()).map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Marca</Label>
              <Select value={current.brand_id?.toString() || 'none'} onValueChange={v => set('brand_id', v === 'none' ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem marca</SelectItem>
                  {brands.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {features.site && (
              <div className="space-y-1.5">
                <Label>Estilo</Label>
                <Select value={current.style || 'none'} onValueChange={v => set('style', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem estilo</SelectItem>
                    {styles.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={current.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Descreva o produto..." />
          </div>
        </div>
      )}

      {/* Step 3 — Mídia + Dimensões */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Imagem principal <span className="text-gray-400 font-normal text-xs">(destaque)</span></Label>
            <div className="flex items-center gap-4">
              {current.image_urls?.[0] ? (
                <div className="relative w-24 h-24 shrink-0">
                  <img src={current.image_urls[0]} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                  <button onClick={() => removeImage(0)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors shrink-0">
                  {imageLoading ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Upload className="w-5 h-5 text-gray-400" />}
                  <span className="text-[10px] text-gray-400 mt-1">Principal</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} disabled={imageLoading} />
                </label>
              )}
              <p className="text-xs text-gray-400">Primeira imagem exibida como foto de destaque no WooCommerce.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Galeria</Label>
            <div className="flex flex-wrap gap-2">
              {(current.image_urls || []).slice(1).map((img, i) => (
                <div key={i} className="relative w-16 h-16">
                  <img src={img} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                  <button onClick={() => removeImage(i + 1)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              {current.image_urls?.[0] && (
                <label className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                  {imageLoading ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4 text-gray-400" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} disabled={imageLoading} />
                </label>
              )}
              {!current.image_urls?.[0] && <p className="text-xs text-gray-400 self-center">Adicione a imagem principal primeiro.</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Dimensões e peso
              {features.dimensions && <span className="text-red-500 ml-0.5">*</span>}
              <span className="ml-1 text-xs font-normal text-gray-400">
                {features.dimensions ? '(obrigatório para cálculo de frete)' : '(opcional)'}
              </span>
            </Label>
            <div className="grid grid-cols-4 gap-3">
              {[['Peso (kg)', 'weight'], ['Largura (cm)', 'width'], ['Altura (cm)', 'height'], ['Prof. (cm)', 'depth']].map(([label, field]) => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs text-gray-500">
                    {label}{features.dimensions && <span className="text-red-500 ml-0.5">*</span>}
                  </Label>
                  <Input
                    type="number" step="any" min="0"
                    value={current[field] || ''}
                    onChange={e => set(field, e.target.value)}
                    placeholder="0"
                    className={features.dimensions && !current[field] ? 'border-red-200 focus-visible:ring-red-300' : ''}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={step === 1 ? onCancel : () => setStep(s => s - 1)}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          {step === 1 ? 'Cancelar' : '← Voltar'}
        </button>
        <div className="flex gap-2">
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && !current.name?.trim()}
              className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Próximo →
            </button>
          ) : (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar produto'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AlertMsg({ alert }) {
  if (!alert) return null
  return (
    <Alert variant={alert.type === 'error' ? 'destructive' : 'success'} className="mb-4">
      {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
      <AlertDescription>{alert.message}</AlertDescription>
    </Alert>
  )
}

// Pills de filtro rápido
const TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Ativos' },
  { key: 'inactive', label: 'Inativos' },
  { key: 'low_stock', label: '⚠️ Estoque crítico' },
]

export default function Products() {
  const { features } = useCompany()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [tags, setTags] = useState([])
  const [styles, setStyles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [alert, setAlert] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [current, setCurrent] = useState(EMPTY_PRODUCT)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState(null)
  const [syncing, setSyncing] = useState(null)
  const [syncingAll, setSyncingAll] = useState(false)
  const [importing, setImporting] = useState(false)
  const [step, setStep] = useState(1)

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 5000)
  }

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [p, c, b, t, st] = await Promise.all([
        api.getAllProducts(),
        api.getAllCategories(),
        api.getAllBrands(),
        api.getAllTags(),
        api.getAllStyles(),
      ])
      setProducts(p)
      setCategories(c)
      setBrands(b)
      setTags(t)
      setStyles(st)
    } catch (e) {
      showAlert('error', 'Erro ao carregar dados: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => { setCurrent(EMPTY_PRODUCT); setStep(1); setDialog('create') }
  const openEdit = (p) => { setCurrent({ ...p }); setStep(1); setDialog('edit') }
  const openDelete = (p) => { setCurrent(p); setDialog('delete') }
  const closeDialog = () => { setDialog(null); setCurrent(EMPTY_PRODUCT); setStep(1); setImageError(null) }

  const handleDuplicate = async (p) => {
    try {
      const { id, woo_id, created_at, updated_at, category, brand, subcategory, ...rest } = p
      const clone = { ...rest, name: `${p.name} (cópia)`, status: 'inactive' }
      const created = await api.createProduct(clone)
      setProducts(prev => [created, ...prev])
      showAlert('success', `"${p.name}" duplicado como rascunho inativo.`)
    } catch (e) {
      showAlert('error', 'Erro ao duplicar: ' + e.message)
    }
  }

  const TARGET_SIZE = 1200
  const MIN_SIZE = 600

  const convertToJpeg = (file) => new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img

      if (w < MIN_SIZE && h < MIN_SIZE) {
        URL.revokeObjectURL(url)
        return reject(new Error(`Imagem muito pequena (${w}x${h}px). Mínimo recomendado: ${MIN_SIZE}x${MIN_SIZE}px.`))
      }

      // cover crop: escala para preencher 1200x1200 e corta do centro
      const scale = Math.max(TARGET_SIZE / w, TARGET_SIZE / h)
      const drawW = w * scale
      const drawH = h * scale
      const offsetX = (TARGET_SIZE - drawW) / 2
      const offsetY = (TARGET_SIZE - drawH) / 2

      const canvas = document.createElement('canvas')
      canvas.width = TARGET_SIZE
      canvas.height = TARGET_SIZE
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE)
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Conversão falhou')), 'image/jpeg', 0.92)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida')) }
    img.src = url
  })

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageLoading(true)
    setImageError(null)
    try {
      const jpeg = await convertToJpeg(file)
      const path = `products/${Date.now()}.jpg`
      const { error } = await supabase.storage.from('product-images').upload(path, jpeg, { contentType: 'image/jpeg' })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
      setCurrent(prev => ({ ...prev, image_urls: [...(prev.image_urls || []), publicUrl] }))
    } catch (err) {
      setImageError(err.message)
    } finally {
      setImageLoading(false)
      e.target.value = ''
    }
  }

  const removeImage = (idx) => {
    setCurrent(prev => ({ ...prev, image_urls: prev.image_urls.filter((_, i) => i !== idx) }))
  }

  const handleSave = async () => {
    if (savingRef.current) return
    if (!current.name?.trim()) return showAlert('error', 'Nome é obrigatório')
    if (!current.price) return showAlert('error', 'Preço é obrigatório')
    if (features.dimensions) {
      if (!current.weight || parseFloat(current.weight) <= 0) { setImageError('Peso é obrigatório para cálculo de frete'); return }
      if (!current.width  || parseFloat(current.width)  <= 0) { setImageError('Largura é obrigatória para cálculo de frete'); return }
      if (!current.height || parseFloat(current.height) <= 0) { setImageError('Altura é obrigatória para cálculo de frete'); return }
      if (!current.depth  || parseFloat(current.depth)  <= 0) { setImageError('Profundidade é obrigatória para cálculo de frete'); return }
    }
    savingRef.current = true
    setSaving(true)
    try {
      const payload = {
        name: current.name.trim(),
        description: current.description || '',
        price: parseFloat(current.price),
        stock: parseInt(current.stock) || 0,
        min_stock: parseInt(current.min_stock) || 5,
        category_id: current.category_id || null,
        subcategory_id: current.subcategory_id || null,
        brand_id: current.brand_id || null,
        status: current.status || 'active',
        image_urls: current.image_urls || [],
        weight: current.weight ? parseFloat(current.weight) : null,
        width: current.width ? parseFloat(current.width) : null,
        height: current.height ? parseFloat(current.height) : null,
        depth: current.depth ? parseFloat(current.depth) : null,
        woo_tags: current.woo_tags || [],
        style: current.style || null,
      }
      if (dialog === 'create') {
        const created = await api.createProduct(payload)
        setProducts(prev => [created, ...prev])
        showAlert('success', `Produto "${created.name}" criado! Use o botão de sync para enviar ao WooCommerce.`)
      } else {
        const updated = await api.updateProduct(current.id, payload)
        const fullProduct = { ...current, ...updated, ...payload, woo_id: current.woo_id }
        setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
        if (current.woo_id) {
          const wooPayload = buildWooPayload(fullProduct)
          try {
            await wooProxy({ method: 'PUT', endpoint: `products/${current.woo_id}`, body: wooPayload })
            showAlert('success', `Produto "${updated.name}" salvo e sincronizado com WooCommerce!`)
          } catch (e) {
            if (e.message?.includes('invalid_id') || e.message?.includes('ID inválido')) {
              await api.updateProduct(current.id, { woo_id: null })
              setProducts(prev => prev.map(p => p.id === current.id ? { ...p, woo_id: null } : p))
              showAlert('error', `Vínculo WooCommerce inválido e removido. Pressione o globo para re-vincular.`)
            } else {
              showAlert('error', `Salvo no ERP, erro no WooCommerce: ${e.message}`)
            }
          }
        } else {
          showAlert('success', `Produto "${updated.name}" salvo! (não vinculado ao WooCommerce)`)
        }
      }
      closeDialog()
    } catch (e) {
      showAlert('error', 'Erro ao salvar: ' + e.message)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const buildWooPayload = (product) => {
    const images = (product.image_urls || []).filter(url => url.startsWith('http')).map(src => ({ src }))
    const catId = product.category_id ? Number(product.category_id) : null
    const subcatId = product.subcategory_id ? Number(product.subcategory_id) : null
    const cat = categories.find(c => c.id === catId)
    const subcat = categories.find(c => c.id === subcatId)
    const wooCats = []
    if (subcat?.woo_id) wooCats.push({ id: subcat.woo_id })
    else if (cat?.woo_id) wooCats.push({ id: cat.woo_id })
    const wooAttributes = product.style
      ? [{ name: 'Estilo', slug: 'estilo', options: [product.style], visible: true }]
      : []
    return {
      name: product.name,
      regular_price: String(product.price || 0),
      description: product.description || '',
      manage_stock: true,
      stock_quantity: Number(product.stock) || 0,
      status: product.status === 'active' ? 'publish' : 'draft',
      ...(wooCats.length > 0 && { categories: wooCats }),
      ...(wooAttributes.length > 0 && { attributes: wooAttributes }),
      ...(product.weight && { weight: String(product.weight) }),
      ...(product.width && { dimensions: { width: String(product.width), height: String(product.height || 0), length: String(product.depth || 0) } }),
      ...(images.length > 0 && { images }),
    }
  }

  const handleSync = async (product) => {
    setSyncing(product.id)
    try {
      const payload = buildWooPayload(product)
      let wooData
      if (product.woo_id) {
        try {
          wooData = await wooProxy({ method: 'PUT', endpoint: `products/${product.woo_id}`, body: payload })
        } catch (e) {
          if (e.message?.includes('invalid_id') || e.message?.includes('ID inválido')) {
            const cid = await getCompanyId()
            await supabase.from('products').update({ woo_id: null }).eq('id', product.id).eq('company_id', cid)
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, woo_id: null } : p))
            wooData = await wooProxy({ method: 'POST', endpoint: 'products', body: { ...payload, type: 'simple' } })
          } else throw e
        }
      } else {
        wooData = await wooProxy({ method: 'POST', endpoint: 'products', body: { ...payload, type: 'simple' } })
      }
      const cid = await getCompanyId()
      await supabase.from('products').update({ woo_id: wooData.id }).eq('id', product.id).eq('company_id', cid)
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, woo_id: wooData.id } : p))
      showAlert('success', `"${product.name}" sincronizado! ID Woo: ${wooData.id}`)
    } catch (e) {
      showAlert('error', 'Erro ao sincronizar: ' + e.message)
    } finally {
      setSyncing(null)
    }
  }

  const handleSyncAll = async () => {
    const unsynced = products.filter(p => !p.woo_id && p.status === 'active')
    if (unsynced.length === 0) {
      showAlert('success', 'Todos os produtos ativos já estão sincronizados!')
      return
    }
    setSyncingAll(true)
    let ok = 0, fail = 0
    for (const product of unsynced) {
      try {
        const payload = buildWooPayload(product)
        const wooData = await wooProxy({ method: 'POST', endpoint: 'products', body: { ...payload, type: 'simple' } })
        const cid = await getCompanyId()
        await supabase.from('products').update({ woo_id: wooData.id }).eq('id', product.id).eq('company_id', cid)
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, woo_id: wooData.id } : p))
        ok++
      } catch {
        fail++
      }
    }
    setSyncingAll(false)
    showAlert(fail === 0 ? 'success' : 'error',
      `Sync em massa: ${ok} enviado(s)${fail > 0 ? `, ${fail} com erro` : ''}.`)
  }

  const handleImportFromWoo = async () => {
    setImporting(true)
    try {
      let page = 1
      let allWoo = []
      while (true) {
        const batch = await wooProxy({ method: 'GET', endpoint: `products?per_page=100&page=${page}&status=any` })
        if (!Array.isArray(batch) || batch.length === 0) break
        allWoo = [...allWoo, ...batch]
        if (batch.length < 100) break
        page++
      }
      if (allWoo.length === 0) { showAlert('error', 'Nenhum produto encontrado no WooCommerce.'); return }

      const existingWooIds = new Set(products.filter(p => p.woo_id).map(p => Number(p.woo_id)))
      const toImport = allWoo.filter(w => !existingWooIds.has(w.id))
      if (toImport.length === 0) { showAlert('success', 'Todos os produtos do WooCommerce já estão importados.'); return }

      let created = 0
      for (const w of toImport) {
        let category_id = null, subcategory_id = null
        for (const wc of (w.categories || [])) {
          const match = categories.find(c => c.woo_id === wc.id)
          if (match) {
            if (match.parent_id) { subcategory_id = match.id; const par = categories.find(c => c.id === match.parent_id); if (par) category_id = par.id }
            else category_id = match.id
          }
        }
        const estiloAttr = w.attributes?.find(a => a.slug === 'estilo' || a.name?.toLowerCase() === 'estilo')
        const payload = {
          name: w.name,
          description: w.description || w.short_description || '',
          price: parseFloat(w.regular_price || w.price || '0') || 0,
          stock: parseInt(w.stock_quantity) || 0,
          min_stock: 5,
          category_id, subcategory_id, brand_id: null,
          status: w.status === 'publish' ? 'active' : 'inactive',
          image_urls: (w.images || []).map(i => i.src).filter(Boolean),
          weight: w.weight ? parseFloat(w.weight) : null,
          width: w.dimensions?.width ? parseFloat(w.dimensions.width) : null,
          height: w.dimensions?.height ? parseFloat(w.dimensions.height) : null,
          depth: w.dimensions?.length ? parseFloat(w.dimensions.length) : null,
          woo_tags: (w.tags || []).map(t => t.name).filter(Boolean),
          style: estiloAttr?.options?.[0] || null,
          woo_id: w.id,
        }
        await api.createProduct(payload)
        created++
      }
      await loadAll()
      showAlert('success', `Importação concluída! ${created} produto(s) importado(s).`)
    } catch (e) {
      showAlert('error', 'Erro ao importar produtos: ' + e.message)
    } finally {
      setImporting(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      if (current.woo_id) {
        try { await wooProxy({ method: 'DELETE', endpoint: `products/${current.woo_id}?force=true` }) } catch {}
      }
      await api.deleteProduct(current.id)
      setProducts(prev => prev.filter(p => p.id !== current.id))
      showAlert('success', `Produto "${current.name}" excluído.`)
      closeDialog()
    } catch (e) {
      showAlert('error', 'Erro ao excluir: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // Filtros combinados
  const filtered = products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
    const matchTab =
      filterTab === 'all' ? true :
      filterTab === 'active' ? p.status === 'active' :
      filterTab === 'inactive' ? p.status === 'inactive' :
      filterTab === 'low_stock' ? (p.stock || 0) < (p.min_stock || 5) : true
    const matchCat = filterCategory === 'all' || p.category_id?.toString() === filterCategory
    return matchSearch && matchTab && matchCat
  })

  const lowStockCount = products.filter(p => (p.stock || 0) < (p.min_stock || 5)).length
  const unsyncedCount = products.filter(p => !p.woo_id && p.status === 'active').length
  const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500">
            {products.length} cadastrados
            {lowStockCount > 0 && <span className="ml-2 text-amber-600 font-medium">· {lowStockCount} com estoque crítico</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {features.site && (
            <>
              <Button variant="outline" onClick={handleImportFromWoo} disabled={importing} className="gap-2">
                <Download className={`h-4 w-4 ${importing ? 'animate-bounce' : ''}`} />
                {importing ? 'Importando...' : 'Importar do Woo'}
              </Button>
              {unsyncedCount > 0 && (
                <Button variant="outline" onClick={handleSyncAll} disabled={syncingAll} className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
                  <RefreshCw className={`h-4 w-4 ${syncingAll ? 'animate-spin' : ''}`} />
                  {syncingAll ? 'Sincronizando...' : `Sync todos (${unsyncedCount})`}
                </Button>
              )}
            </>
          )}
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Produto
          </Button>
        </div>
      </div>

      <AlertMsg alert={alert} />

      <Card>
        <CardHeader className="pb-3 space-y-3">
          {/* Busca + Filtro por categoria */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar produtos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.filter(c => !c.parent_id).map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pills de filtro rápido */}
          <div className="flex gap-1.5 flex-wrap">
            {TABS.map(tab => {
              const count =
                tab.key === 'all' ? products.length :
                tab.key === 'active' ? products.filter(p => p.status === 'active').length :
                tab.key === 'inactive' ? products.filter(p => p.status === 'inactive').length :
                lowStockCount
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border
                    ${filterTab === tab.key
                      ? tab.key === 'low_stock'
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : 'bg-gray-900 border-gray-900 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                >
                  {tab.label} <span className="opacity-60 ml-0.5">{count}</span>
                </button>
              )
            })}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Nenhum produto encontrado</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-28" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(p => (
                      <TableRow key={p.id} className={(p.stock || 0) < (p.min_stock || 5) ? 'bg-amber-50/40' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {p.image_urls?.[0] ? (
                              <img src={p.image_urls[0]} alt={p.name} className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">IMG</div>
                            )}
                            <div>
                              <span className="font-medium text-sm text-gray-900">{p.name}</span>
                              {!p.woo_id && p.status === 'active' && (
                                <span className="ml-2 text-[10px] text-orange-500 font-medium">não sincronizado</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{p.category?.name || '—'}</TableCell>
                        <TableCell className="text-sm text-gray-500">{p.brand?.name || '—'}</TableCell>
                        <TableCell className="text-sm font-medium">{fmt(p.price)}</TableCell>
                        <TableCell>
                          <Badge variant={(p.stock || 0) < (p.min_stock || 5) ? 'warning' : 'success'}>
                            {p.stock ?? 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'active' ? 'success' : 'secondary'}>
                            {p.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)} title="Editar">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-700" onClick={() => handleDuplicate(p)} title="Duplicar">
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className={`h-7 w-7 ${p.woo_id ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:text-blue-500'}`}
                              onClick={() => handleSync(p)}
                              disabled={syncing === p.id}
                              title={p.woo_id ? `Sincronizado (WooID: ${p.woo_id})` : 'Sincronizar com WooCommerce'}
                            >
                              <Globe className={`h-3.5 w-3.5 ${syncing === p.id ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => openDelete(p)} title="Excluir">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {filtered.map(p => (
                  <div key={p.id} className={`p-4 flex items-center gap-3 ${(p.stock || 0) < (p.min_stock || 5) ? 'bg-amber-50/40' : ''}`}>
                    {p.image_urls?.[0] ? (
                      <img src={p.image_urls[0]} alt={p.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs shrink-0">IMG</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.category?.name || 'Sem categoria'}{p.brand?.name ? ` · ${p.brand.name}` : ''}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-sm font-bold text-gray-900">{fmt(p.price)}</span>
                        <Badge variant={(p.stock || 0) < (p.min_stock || 5) ? 'warning' : 'success'} className="text-xs">{p.stock ?? 0} un.</Badge>
                        <Badge variant={p.status === 'active' ? 'success' : 'secondary'} className="text-xs">{p.status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={() => handleDuplicate(p)}><Copy className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className={`h-8 w-8 ${p.woo_id ? 'text-green-500' : 'text-gray-400'}`} onClick={() => handleSync(p)} disabled={syncing === p.id}>
                        <Globe className={`h-4 w-4 ${syncing === p.id ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => openDelete(p)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialog === 'create' || dialog === 'edit'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialog === 'create' ? 'Novo Produto' : 'Editar Produto'}</DialogTitle>
          </DialogHeader>
          <ProductStepper
            step={step} setStep={setStep}
            current={current} setCurrent={setCurrent}
            categories={categories} brands={brands}
            styles={styles} features={features}
            imageLoading={imageLoading}
            imageError={imageError}
            handleUploadImage={handleUploadImage}
            removeImage={removeImage}
            saving={saving}
            onSave={handleSave}
            onCancel={closeDialog}
            isEdit={dialog === 'edit'}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={dialog === 'delete'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Produto</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Tem certeza que deseja excluir <strong>"{current.name}"</strong>? Esta ação não pode ser desfeita.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
