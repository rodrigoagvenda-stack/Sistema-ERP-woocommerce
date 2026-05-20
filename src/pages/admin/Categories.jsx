import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Globe, CheckCircle2, AlertCircle, X, ImageIcon, Download, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api, wooProxy } from '@/lib/api'
import { supabase } from '@/lib/supabase'

const EMPTY = { name: '', slug: '', status: 'active', parent_id: null, woo_id: null, image_url: '' }

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [current, setCurrent] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(null)
  const [importing, setImporting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef(null)

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { setCategories(await api.getAllCategories()) }
    catch (e) { showAlert('error', e.message) }
    finally { setLoading(false) }
  }

  const openCreate = () => { setCurrent(EMPTY); setDialog('create') }
  const openEdit = (c) => { setCurrent({ ...c }); setDialog('edit') }
  const openDelete = (c) => { setCurrent(c); setDialog('delete') }
  const closeDialog = () => { setDialog(null); setCurrent(EMPTY) }

  const handleSave = async () => {
    if (!current.name?.trim()) return showAlert('error', 'Nome é obrigatório')
    setSaving(true)
    try {
      const payload = {
        name: current.name.trim(),
        slug: current.slug?.trim() || current.name.toLowerCase().replace(/\s+/g, '-'),
        status: current.status,
        parent_id: current.parent_id || null,
        woo_id: current.woo_id || null,
        image_url: current.image_url || null,
      }
      if (dialog === 'create') {
        const created = await api.createCategory(payload)
        setCategories(prev => [...prev, created])
        try {
          const allCats = [...categories, created]
          const { wooId } = await syncCategoryToWoo(created, allCats)
          await api.updateCategory(created.id, { woo_id: wooId })
          setCategories(prev => prev.map(c => c.id === created.id ? { ...c, woo_id: wooId } : c))
          showAlert('success', `Categoria "${created.name}" criada e sincronizada com WooCommerce!`)
        } catch {
          showAlert('success', `Categoria "${created.name}" criada! Sincronize manualmente com o WooCommerce.`)
        }
      } else {
        const updated = await api.updateCategory(current.id, payload)
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c))
        try {
          const wooImg = await resolveWooImage(payload.image_url)
          const wooBody = (base) => wooImg ? { ...base, image: wooImg } : base
          if (current.woo_id) {
            await wooProxy({ method: 'PUT', endpoint: `products/categories/${current.woo_id}`, body: wooBody({ name: payload.name, slug: payload.slug }) })
          } else {
            const base = { name: payload.name, slug: payload.slug }
            const parent = categories.find(c => c.id === payload.parent_id)
            if (parent?.woo_id) base.parent = parent.woo_id
            const wooData = await wooProxy({ method: 'POST', endpoint: 'products/categories', body: wooBody(base) })
            await api.updateCategory(current.id, { woo_id: wooData.id })
            setCategories(prev => prev.map(c => c.id === current.id ? { ...c, woo_id: wooData.id } : c))
          }
          showAlert('success', `Categoria "${updated.name}" atualizada e sincronizada!`)
        } catch (e) {
          showAlert('error', `Salvo no ERP, mas erro ao sincronizar: ${e.message}`)
        }
      }
      closeDialog()
    } catch (e) {
      showAlert('error', 'Erro ao salvar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      if (current.woo_id) {
        try { await wooProxy({ method: 'DELETE', endpoint: `products/categories/${current.woo_id}?force=true` }) } catch {}
      }
      await api.deleteCategory(current.id)
      setCategories(prev => prev.filter(c => c.id !== current.id))
      showAlert('success', `Categoria "${current.name}" excluída.`)
      closeDialog()
    } catch (e) {
      showAlert('error', 'Erro ao excluir: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

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

  const resolveWooImage = (image_url) => {
    if (!image_url) return null
    return { src: image_url }
  }

  const handleUploadImage = async (file) => {
    if (!file) return
    setUploadingImage(true)
    try {
      const jpeg = await convertToJpeg(file)
      const path = `categories/${Date.now()}.jpg`
      const { error } = await supabase.storage.from('product-images').upload(path, jpeg, { contentType: 'image/jpeg' })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
      setCurrent(p => ({ ...p, image_url: publicUrl }))
    } catch (e) {
      showAlert('error', 'Erro ao fazer upload: ' + e.message)
    } finally {
      setUploadingImage(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const syncCategoryToWoo = async (cat, currentCategories) => {
    const wooImg = await resolveWooImage(cat.image_url)
    const withImage = (body) => wooImg ? { ...body, image: wooImg } : body

    if (cat.woo_id) {
      try {
        const wooData = await wooProxy({ method: 'PUT', endpoint: `products/categories/${cat.woo_id}`, body: withImage({ name: cat.name, slug: cat.slug }) })
        return { wooId: wooData.id }
      } catch (e) {
        if (e.message?.includes('term_invalid') || e.message?.includes('inexistente') || e.message?.includes('404')) {
          // woo_id inválido nesta loja — reseta e cria do zero
          await api.updateCategory(cat.id, { woo_id: null })
          setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, woo_id: null } : c))
          cat = { ...cat, woo_id: null }
        } else throw e
      }
    }

    // Monta body sem slug (deixa WooCommerce gerar) para evitar conflitos
    const body = { name: cat.name }

    if (cat.parent_id) {
      let parent = currentCategories.find(c => c.id === cat.parent_id)
      if (parent && !parent.woo_id) {
        const parentResult = await syncCategoryToWoo(parent, currentCategories)
        parent = { ...parent, woo_id: parentResult.wooId }
        await api.updateCategory(parent.id, { woo_id: parentResult.wooId })
        setCategories(prev => prev.map(c => c.id === parent.id ? { ...c, woo_id: parentResult.wooId } : c))
        currentCategories = currentCategories.map(c => c.id === parent.id ? { ...c, woo_id: parentResult.wooId } : c)
      }
      if (parent?.woo_id) body.parent = parent.woo_id
    }

    // Tentativa 1: POST com parent (se tiver)
    try {
      const wooData = await wooProxy({ method: 'POST', endpoint: 'products/categories', body: withImage(body) })
      return { wooId: wooData.id }
    } catch {}

    // Tentativa 2: POST sem parent (parent pode estar inválido no Woo)
    if (body.parent) {
      try {
        const { parent: _, ...bodyNoParent } = body
        const wooData = await wooProxy({ method: 'POST', endpoint: 'products/categories', body: withImage(bodyNoParent) })
        return { wooId: wooData.id }
      } catch {}
    }

    // Tentativa 3: busca pelo nome no WooCommerce (pode já existir)
    const byName = await wooProxy({ method: 'GET', endpoint: `products/categories?search=${encodeURIComponent(cat.name)}&per_page=20` })
    const match = Array.isArray(byName) && byName.find(c => c.name.toLowerCase() === cat.name.toLowerCase())
    if (match) return { wooId: match.id }

    throw new Error(`Não foi possível criar ou encontrar a categoria "${cat.name}" no WooCommerce`)
  }

  const handleSync = async (cat) => {
    setSyncing(cat.id)
    try {
      const { wooId } = await syncCategoryToWoo(cat, categories)
      await api.updateCategory(cat.id, { woo_id: wooId })
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, woo_id: wooId } : c))
      showAlert('success', `Categoria sincronizada! ID Woo: ${wooId}`)
    } catch (e) {
      showAlert('error', 'Erro ao sincronizar: ' + e.message)
    } finally {
      setSyncing(null)
    }
  }

  const handleImportFromWoo = async () => {
    setImporting(true)
    try {
      // Busca todas as categorias do WooCommerce (até 100)
      const wooData = await wooProxy({ method: 'GET', endpoint: 'products/categories?per_page=100&hide_empty=false' })
      const wooCats = Array.isArray(wooData) ? wooData : (wooData?.categories || [])

      if (!wooCats.length) {
        showAlert('error', 'Nenhuma categoria encontrada no WooCommerce.')
        return
      }

      const existing = await api.getAllCategories()
      const existingWooIds = new Set(existing.map(c => c.woo_id).filter(Boolean))

      // Importa primeiro as categorias pai (parent === 0)
      const parents = wooCats.filter(c => !c.parent || c.parent === 0)
      const children = wooCats.filter(c => c.parent && c.parent !== 0)

      let created = 0
      const wooIdToLocalId = {}

      // Mapeia categorias já existentes
      existing.forEach(c => { if (c.woo_id) wooIdToLocalId[c.woo_id] = c.id })

      for (const cat of parents) {
        if (existingWooIds.has(cat.id)) continue
        const novo = await api.createCategory({
          name: cat.name,
          slug: cat.slug,
          woo_id: cat.id,
          parent_id: null,
          image_url: cat.image?.src || null,
        })
        wooIdToLocalId[cat.id] = novo.id
        created++
      }

      for (const cat of children) {
        if (existingWooIds.has(cat.id)) continue
        const novo = await api.createCategory({
          name: cat.name,
          slug: cat.slug,
          woo_id: cat.id,
          parent_id: wooIdToLocalId[cat.parent] || null,
          image_url: cat.image?.src || null,
        })
        wooIdToLocalId[cat.id] = novo.id
        created++
      }

      await load()
      showAlert('success', `${created} categoria(s) importada(s) do WooCommerce!`)
    } catch (e) {
      showAlert('error', 'Erro ao importar: ' + e.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Categorias</h1>
          <p className="text-sm text-gray-500">{categories.length} categorias</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportFromWoo} disabled={importing} className="gap-2">
            {importing ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Download className="h-4 w-4" />}
            {importing ? 'Importando...' : 'Importar do Woo'}
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Categoria
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          <strong>Categoria vs Subcategoria:</strong> a categoria PAI é o agrupamento principal. Para criar uma subcategoria, selecione uma categoria existente no campo <em>"Categoria Pai"</em> ao criar uma nova. No produto, o campo "Categoria" lista as PAIs e "Subcategoria" filtra as filhas automaticamente.
        </span>
      </div>

      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'success'}>
          {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Nenhuma categoria cadastrada</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Pai</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Woo ID</TableHead>
                      <TableHead className="w-28" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map(c => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                              {c.image_url
                                ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                                : <span className="text-gray-400 font-bold text-sm">{c.name[0]?.toUpperCase()}</span>
                              }
                            </div>
                            <span className="font-medium text-sm">{c.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{c.slug || '—'}</TableCell>
                        <TableCell className="text-sm text-gray-500">{c.parent?.name || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={c.status === 'active' ? 'success' : 'secondary'}>
                            {c.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {c.woo_id ? <Badge variant="info">{c.woo_id}</Badge> : <span className="text-gray-400 text-xs">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-400 hover:text-blue-600" onClick={() => handleSync(c)} disabled={syncing === c.id} title="Sync WooCommerce">
                              {syncing === c.id ? <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => openDelete(c)}>
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
                {categories.map(c => (
                  <div key={c.id} className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                      {c.image_url
                        ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                        : <span className="text-gray-500 font-bold text-sm">{c.name[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.parent?.name ? `Pai: ${c.parent.name}` : 'Sem categoria pai'}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant={c.status === 'active' ? 'success' : 'secondary'} className="text-xs">
                          {c.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {c.woo_id && <Badge variant="info" className="text-xs">Woo #{c.woo_id}</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400" onClick={() => handleSync(c)} disabled={syncing === c.id}>
                        {syncing === c.id ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <Globe className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => openDelete(c)}>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog === 'create' ? 'Nova Categoria' : 'Editar Categoria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image upload */}
            <div className="space-y-1.5">
              <Label>Imagem</Label>
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleUploadImage(e.target.files[0])} />
              {current.image_url ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                  <img src={current.image_url} alt="categoria" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setCurrent(p => ({ ...p, image_url: '' }))}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}
                  className="w-full h-24 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors">
                  {uploadingImage
                    ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    : <>
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-xs">Clique para fazer upload</span>
                      </>
                  }
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={current.name} onChange={e => setCurrent(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={current.slug || ''} onChange={e => setCurrent(p => ({ ...p, slug: e.target.value }))} placeholder="gerado-automaticamente" />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria Pai</Label>
              <Select value={current.parent_id?.toString() || 'none'} onValueChange={v => setCurrent(p => ({ ...p, parent_id: v === 'none' ? null : v }))}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {categories.filter(c => c.id !== current.id).map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={current.status} onValueChange={v => setCurrent(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : (dialog === 'create' ? 'Criar' : 'Salvar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={dialog === 'delete'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir Categoria</DialogTitle></DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Excluir <strong>"{current.name}"</strong>? Produtos vinculados perderão a categoria.</AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>{saving ? 'Excluindo...' : 'Excluir'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
