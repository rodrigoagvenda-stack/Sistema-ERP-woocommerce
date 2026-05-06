import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, CheckCircle2, AlertCircle, X, Upload, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

function ProductStepper({ step, setStep, current, setCurrent, categories, brands, styles, features, imageLoading, handleUploadImage, removeImage, saving, onSave, onCancel, isEdit }) {
  const set = (key, val) => setCurrent(p => ({ ...p, [key]: val }))

  return (
    <div>
      <StepIndicator step={step} />

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
          {/* Imagem principal */}
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

          {/* Galeria */}
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

          {/* Dimensões */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Dimensões e peso</Label>
            <div className="grid grid-cols-4 gap-3">
              {[['Peso (kg)', 'weight'], ['Largura (cm)', 'width'], ['Altura (cm)', 'height'], ['Prof. (cm)', 'depth']].map(([label, field]) => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs text-gray-500">{label}</Label>
                  <Input type="number" step="0.01" value={current[field] || ''} onChange={e => set(field, e.target.value)} placeholder="0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer nav */}
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

export default function Products() {
  const { features } = useCompany()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [tags, setTags] = useState([])
  const [styles, setStyles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [alert, setAlert] = useState(null)
  const [dialog, setDialog] = useState(null) // null | 'create' | 'edit' | 'delete'
  const [current, setCurrent] = useState(EMPTY_PRODUCT)
  const [saving, setSaving] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [syncing, setSyncing] = useState(null) // product id being synced
  const [step, setStep] = useState(1)

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  useEffect(() => {
    loadAll()
  }, [])

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
  const closeDialog = () => { setDialog(null); setCurrent(EMPTY_PRODUCT); setStep(1) }

  const convertToJpeg = (file) => new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
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
    try {
      // Converte para JPEG (garante compatibilidade com WooCommerce/WordPress)
      const jpeg = await convertToJpeg(file)
      const path = `products/${Date.now()}.jpg`
      const { error } = await supabase.storage.from('product-images').upload(path, jpeg, { contentType: 'image/jpeg' })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
      setCurrent(prev => ({ ...prev, image_urls: [...(prev.image_urls || []), publicUrl] }))
    } catch (err) {
      showAlert('error', 'Erro ao fazer upload: ' + err.message)
    } finally {
      setImageLoading(false)
      e.target.value = ''
    }
  }

  const removeImage = (idx) => {
    setCurrent(prev => ({ ...prev, image_urls: prev.image_urls.filter((_, i) => i !== idx) }))
  }

  const handleSave = async () => {
    if (!current.name?.trim()) return showAlert('error', 'Nome é obrigatório')
    if (!current.price) return showAlert('error', 'Preço é obrigatório')
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
        setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
        // Sincronizar com WooCommerce se tiver woo_id
        if (current.woo_id) {
          const images = (payload.image_urls || []).filter(url => url.startsWith('http')).map(src => ({ src }))
          const cat = categories.find(c => c.id === payload.category_id)
          const subcat = categories.find(c => c.id === payload.subcategory_id)
          const wooCats = []
          if (subcat?.woo_id) wooCats.push({ id: subcat.woo_id })
          else if (cat?.woo_id) wooCats.push({ id: cat.woo_id })
          const wooAttributes = payload.style
            ? [{ name: 'Estilo', slug: 'estilo', options: [payload.style], visible: true }]
            : []
          const wooPayload = {
            name: payload.name,
            regular_price: String(payload.price || 0),
            description: payload.description || '',
            manage_stock: true,
            stock_quantity: Number(payload.stock) || 0,
            status: payload.status === 'active' ? 'publish' : 'draft',
            ...(wooCats.length > 0 && { categories: wooCats }),
            ...(wooAttributes.length > 0 && { attributes: wooAttributes }),
            ...(images.length > 0 && { images }),
          }
          try {
            await wooProxy({ method: 'PUT', endpoint: `products/${current.woo_id}`, body: wooPayload })
            showAlert('success', `Produto "${updated.name}" atualizado e sincronizado com WooCommerce!`)
          } catch (e) {
            if (e.message?.includes('invalid_id') || e.message?.includes('ID inválido')) {
              await api.updateProduct(current.id, { woo_id: null })
              setProducts(prev => prev.map(p => p.id === current.id ? { ...p, woo_id: null } : p))
            }
            showAlert('success', `Produto "${updated.name}" atualizado no ERP (sincronize manualmente com o WooCommerce).`)
          }
        } else {
          showAlert('success', `Produto "${updated.name}" atualizado!`)
        }
      }
      closeDialog()
    } catch (e) {
      showAlert('error', 'Erro ao salvar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async (product) => {
    setSyncing(product.id)
    try {
      const images = (product.image_urls || [])
        .filter(url => url.startsWith('http'))
        .map(src => ({ src }))

      const cat = categories.find(c => c.id === product.category_id)
      const subcat = categories.find(c => c.id === product.subcategory_id)
      // Monta lista de categorias WooCommerce: prioriza subcategoria (Woo inclui pai automaticamente)
      const wooCats = []
      if (subcat?.woo_id) wooCats.push({ id: subcat.woo_id })
      else if (cat?.woo_id) wooCats.push({ id: cat.woo_id })

      const wooAttributes = product.style
        ? [{ name: 'Estilo', slug: 'estilo', options: [product.style], visible: true }]
        : []

      const payload = {
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

      let wooData
      if (product.woo_id) {
        try {
          wooData = await wooProxy({ method: 'PUT', endpoint: `products/${product.woo_id}`, body: payload })
        } catch (e) {
          if (e.message?.includes('invalid_id') || e.message?.includes('ID inválido')) {
            // woo_id inválido nesta loja — reseta e cria como novo
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

      showAlert('success', `"${product.name}" sincronizado com WooCommerce! ID: ${wooData.id}`)
    } catch (e) {
      showAlert('error', 'Erro ao sincronizar: ' + e.message)
    } finally {
      setSyncing(null)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      // Deletar do WooCommerce primeiro se tiver woo_id
      if (current.woo_id) {
        try {
          await wooProxy({ method: 'DELETE', endpoint: `products/${current.woo_id}?force=true` })
        } catch {
          // Continua mesmo se falhar no Woo
        }
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

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500">{products.length} produtos cadastrados</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Produto
        </Button>
      </div>

      <AlertMsg alert={alert} />

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar produtos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
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
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {p.image_urls?.[0] ? (
                              <img src={p.image_urls[0]} alt={p.name} className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">IMG</div>
                            )}
                            <span className="font-medium text-sm text-gray-900">{p.name}</span>
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
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className={`h-7 w-7 ${p.woo_id ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:[color:var(--brand)]'}`}
                              onClick={() => handleSync(p)}
                              disabled={syncing === p.id}
                              title={p.woo_id ? `Sincronizado (WooID: ${p.woo_id})` : 'Sincronizar com WooCommerce'}
                            >
                              <Globe className={`h-3.5 w-3.5 ${syncing === p.id ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => openDelete(p)}>
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
                  <div key={p.id} className="p-4 flex items-center gap-3">
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
                        <Badge variant={(p.stock || 0) < (p.min_stock || 5) ? 'warning' : 'success'} className="text-xs">
                          {p.stock ?? 0} un.
                        </Badge>
                        <Badge variant={p.status === 'active' ? 'success' : 'secondary'} className="text-xs">
                          {p.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className={`h-8 w-8 ${p.woo_id ? 'text-green-500' : 'text-gray-400'}`}
                        onClick={() => handleSync(p)}
                        disabled={syncing === p.id}
                      >
                        <Globe className={`h-4 w-4 ${syncing === p.id ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => openDelete(p)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
            styles={styles}
            features={features}
            imageLoading={imageLoading}
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
