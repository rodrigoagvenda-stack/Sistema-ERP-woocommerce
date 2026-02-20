import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, CheckCircle2, AlertCircle, GripVertical, Save, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'

const SUPABASE_URL = 'https://dkvznmmiiiljyrkopiqx.supabase.co'
const BUCKET = 'product-images'
const EMPTY_ITEM = { name: '', description: '', image_url: '', category: '', rating: 5 }

export default function NossasCervejas() {
  const [config, setConfig] = useState({ page_title: 'Nossas Cervejas', page_description: '', logo_url: '' })
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [current, setCurrent] = useState(EMPTY_ITEM)
  const [saving, setSaving] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileRef = useRef(null)

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [{ data: cfg }, { data: its }] = await Promise.all([
        supabase.from('nossas_cervejas_config').select('*').limit(1).single(),
        supabase.from('nossas_cervejas_items').select('*').order('sort_order', { ascending: true }),
      ])
      if (cfg) setConfig(cfg)
      if (its) setItems(its)
    } catch (e) {
      showAlert('error', 'Erro ao carregar: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    setSavingConfig(true)
    try {
      const { error } = await supabase
        .from('nossas_cervejas_config')
        .update({
          page_title: config.page_title,
          page_description: config.page_description,
          logo_url: config.logo_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id)
      if (error) throw error
      showAlert('success', 'Configurações salvas!')
    } catch (e) {
      showAlert('error', 'Erro ao salvar: ' + e.message)
    } finally {
      setSavingConfig(false)
    }
  }

  const handleUploadImage = async (file) => {
    if (!file) return
    setUploadingImage(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `cervejas/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
      if (error) throw error
      const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
      setCurrent(p => ({ ...p, image_url: url }))
    } catch (e) {
      showAlert('error', 'Erro no upload: ' + e.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSaveItem = async () => {
    if (!current.name?.trim()) return showAlert('error', 'Nome é obrigatório')
    setSaving(true)
    try {
      const payload = {
        name: current.name,
        description: current.description,
        image_url: current.image_url,
        category: current.category,
        rating: parseFloat(current.rating) || 5,
      }
      if (dialog === 'create') {
        const { data, error } = await supabase
          .from('nossas_cervejas_items')
          .insert({ ...payload, sort_order: items.length })
          .select().single()
        if (error) throw error
        setItems(prev => [...prev, data])
        showAlert('success', `"${data.name}" adicionada!`)
      } else {
        const { data, error } = await supabase
          .from('nossas_cervejas_items')
          .update(payload)
          .eq('id', current.id)
          .select().single()
        if (error) throw error
        setItems(prev => prev.map(i => i.id === data.id ? data : i))
        showAlert('success', `"${data.name}" atualizada!`)
      }
      setDialog(null)
      setCurrent(EMPTY_ITEM)
    } catch (e) {
      showAlert('error', 'Erro: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from('nossas_cervejas_items').delete().eq('id', current.id)
      if (error) throw error
      setItems(prev => prev.filter(i => i.id !== current.id))
      showAlert('success', `"${current.name}" removida.`)
      setDialog(null)
      setCurrent(EMPTY_ITEM)
    } catch (e) {
      showAlert('error', 'Erro: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const moveItem = async (index, direction) => {
    const newItems = [...items]
    const target = index + direction
    if (target < 0 || target >= newItems.length) return
    ;[newItems[index], newItems[target]] = [newItems[target], newItems[index]]
    setItems(newItems)
    await Promise.all(newItems.map((item, i) =>
      supabase.from('nossas_cervejas_items').update({ sort_order: i }).eq('id', item.id)
    ))
  }

  const renderStars = (rating) => {
    const r = parseFloat(rating) || 0
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-3 w-3 ${i < r ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
    ))
  }

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>

  return (
    <div className="h-full">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Nossas Cervejas</h1>
        <p className="text-sm text-gray-500">Gerencie a página pública de cervejas do site</p>
      </div>

      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-6" style={{ minHeight: 'calc(100vh - 160px)' }}>

        {/* Coluna esquerda — editor */}
        <div className="space-y-4 overflow-y-auto">

          {/* Config da página */}
          <Card>
            <CardHeader className="pb-3">
              <p className="text-sm font-semibold text-gray-700">Card Principal</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>URL do Logo</Label>
                <Input
                  value={config.logo_url || ''}
                  onChange={e => setConfig(p => ({ ...p, logo_url: e.target.value }))}
                  placeholder="https://..."
                />
                {config.logo_url && (
                  <img src={config.logo_url} alt="logo" className="h-10 object-contain mt-1" />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Título</Label>
                <Input
                  value={config.page_title}
                  onChange={e => setConfig(p => ({ ...p, page_title: e.target.value }))}
                  placeholder="Nossas Cervejas"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea
                  value={config.page_description}
                  onChange={e => setConfig(p => ({ ...p, page_description: e.target.value }))}
                  placeholder="Uma breve descrição..."
                  rows={2}
                />
              </div>
              <Button onClick={handleSaveConfig} disabled={savingConfig} size="sm" className="gap-2">
                <Save className="h-3.5 w-3.5" />
                {savingConfig ? 'Salvando...' : 'Salvar configurações'}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de cervejas */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Cervejas ({items.length})</p>
              <Button size="sm" onClick={() => { setCurrent(EMPTY_ITEM); setDialog('create') }} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {items.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">Nenhuma cerveja cadastrada</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-3 p-3">
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button className="text-gray-300 hover:text-gray-500 disabled:opacity-20" onClick={() => moveItem(index, -1)} disabled={index === 0}>
                          <GripVertical className="h-3.5 w-3.5" />
                        </button>
                        <button className="text-gray-300 hover:text-gray-500 disabled:opacity-20 rotate-180" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}>
                          <GripVertical className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {item.image_url
                        ? <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0 bg-gray-100" />
                        : <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-gray-300 text-xs">sem img</div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                        {item.category && <p className="text-xs text-amber-600 font-medium truncate mt-0.5">{item.category}</p>}
                        <div className="flex gap-0.5 mt-1">{renderStars(item.rating)}</div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setCurrent({ ...item }); setDialog('edit') }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => { setCurrent(item); setDialog('delete') }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita — preview */}
        <div className="sticky top-0">
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm" style={{ height: 'calc(100vh - 160px)' }}>
            <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-xs text-gray-400 ml-2">Preview</span>
            </div>
            <div className="overflow-auto" style={{ height: 'calc(100% - 37px)', padding: '16px', background: '#F3F4F8' }}>
              {/* Preview do slide — espelho do layout WordPress */}
              <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 3px 6px rgba(0,0,0,.18)', padding: '36px 16px 20px', position: 'relative' }}>
                {/* Setas */}
                <div style={{ position: 'absolute', top: '10px', right: '12px', display: 'flex', gap: '6px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F3F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.15)', fontSize: '13px', color: '#000', opacity: .3 }}>←</div>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F3F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.15)', fontSize: '13px', color: '#000' }}>→</div>
                </div>
                {/* Cards */}
                <div style={{ display: 'flex', gap: '12px', overflow: 'hidden' }}>
                  {items.length === 0 && (
                    <p style={{ fontSize: '12px', color: '#aaa', margin: '20px auto' }}>Nenhuma cerveja cadastrada</p>
                  )}
                  {items.slice(0, 3).map(item => (
                    <div key={item.id} style={{ width: '140px', minWidth: '140px', height: '140px', background: '#F3F4F8', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                      {item.image_url
                        ? <img src={item.image_url} alt={item.name} style={{ width: '140px', height: '79px', minHeight: '79px', objectFit: 'cover', display: 'block', borderRadius: '8px 8px 0 0', flexShrink: 0 }} />
                        : <div style={{ width: '140px', height: '79px', minHeight: '79px', background: '#e8e8e8', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: '22px', flexShrink: 0 }}>🍺</div>
                      }
                      <div style={{ padding: '7px 8px', flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: '10px', margin: 0, marginBottom: '3px', color: '#000', lineHeight: 1.3 }}>{item.name}</p>
                        <p style={{ fontSize: '9px', color: '#333', margin: 0, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog create/edit */}
      <Dialog open={dialog === 'create' || dialog === 'edit'} onOpenChange={() => { setDialog(null); setCurrent(EMPTY_ITEM) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog === 'create' ? 'Nova Cerveja' : 'Editar Cerveja'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={current.name} onChange={e => setCurrent(p => ({ ...p, name: e.target.value }))} autoFocus placeholder="Ex: IPA Artesanal" />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria <span className="text-gray-400 font-normal text-xs">(ex: IPA, Lager, Stout)</span></Label>
              <Input value={current.category || ''} onChange={e => setCurrent(p => ({ ...p, category: e.target.value }))} placeholder="Ex: IPA Artesanal" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                value={current.description}
                onChange={e => setCurrent(p => ({ ...p, description: e.target.value }))}
                placeholder="Uma breve descrição da cerveja..."
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Avaliação <span className="text-gray-400 font-normal text-xs">(1 a 5 estrelas)</span></Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="1" max="5" step="0.5"
                  value={current.rating ?? 5}
                  onChange={e => setCurrent(p => ({ ...p, rating: e.target.value }))}
                  className="w-24"
                />
                <div className="flex gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`h-4 w-4 cursor-pointer ${i < (current.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                      onClick={() => setCurrent(p => ({ ...p, rating: i + 1 }))} />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Imagem</Label>
              <div className="flex gap-3 items-start">
                {current.image_url
                  ? <img src={current.image_url} alt="preview" className="w-20 h-20 rounded-lg object-cover bg-gray-100 shrink-0" />
                  : <div className="w-20 h-20 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-gray-300 text-xs text-center leading-tight p-1">sem imagem</div>
                }
                <div className="space-y-2 flex-1">
                  <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => fileRef.current?.click()} disabled={uploadingImage}>
                    {uploadingImage ? 'Enviando...' : 'Fazer upload'}
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleUploadImage(e.target.files?.[0])} />
                  <Input
                    value={current.image_url}
                    onChange={e => setCurrent(p => ({ ...p, image_url: e.target.value }))}
                    placeholder="ou cole uma URL..."
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialog(null); setCurrent(EMPTY_ITEM) }}>Cancelar</Button>
            <Button onClick={handleSaveItem} disabled={saving || uploadingImage}>
              {saving ? 'Salvando...' : (dialog === 'create' ? 'Adicionar' : 'Salvar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog delete */}
      <Dialog open={dialog === 'delete'} onOpenChange={() => { setDialog(null); setCurrent(EMPTY_ITEM) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remover Cerveja</DialogTitle></DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Remover <strong>"{current.name}"</strong>? Esta ação não pode ser desfeita.</AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialog(null); setCurrent(EMPTY_ITEM) }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>{saving ? 'Removendo...' : 'Remover'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
