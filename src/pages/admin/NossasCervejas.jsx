import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, CheckCircle2, AlertCircle, GripVertical, Save, Eye } from 'lucide-react'
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

const EMPTY_ITEM = { name: '', description: '', image_url: '' }

export default function NossasCervejas() {
  const [config, setConfig] = useState({ page_title: 'Nossas Cervejas', page_description: '' })
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [dialog, setDialog] = useState(null) // 'create' | 'edit' | 'delete'
  const [current, setCurrent] = useState(EMPTY_ITEM)
  const [saving, setSaving] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
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
        .update({ page_title: config.page_title, page_description: config.page_description, updated_at: new Date().toISOString() })
        .eq('id', config.id)
      if (error) throw error
      showAlert('success', 'Configurações da página salvas!')
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
      if (dialog === 'create') {
        const { data, error } = await supabase
          .from('nossas_cervejas_items')
          .insert({ name: current.name, description: current.description, image_url: current.image_url, sort_order: items.length })
          .select().single()
        if (error) throw error
        setItems(prev => [...prev, data])
        showAlert('success', `"${data.name}" adicionada!`)
      } else {
        const { data, error } = await supabase
          .from('nossas_cervejas_items')
          .update({ name: current.name, description: current.description, image_url: current.image_url })
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

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nossas Cervejas</h1>
          <p className="text-sm text-gray-500">Gerencie a página pública de cervejas do site</p>
        </div>
        <Button variant={previewMode ? 'default' : 'outline'} onClick={() => setPreviewMode(p => !p)} className="gap-2">
          <Eye className="h-4 w-4" />
          {previewMode ? 'Fechar Preview' : 'Preview'}
        </Button>
      </div>

      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
          {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <div className={`grid gap-6 ${previewMode ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* Editor */}
        <div className="space-y-6">
          {/* Config da página */}
          <Card>
            <CardHeader className="pb-3">
              <p className="text-sm font-semibold text-gray-700">Cabeçalho da Página</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Título da página</Label>
                <Input
                  value={config.page_title}
                  onChange={e => setConfig(p => ({ ...p, page_title: e.target.value }))}
                  placeholder="Nossas Cervejas"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição / subtítulo</Label>
                <Textarea
                  value={config.page_description}
                  onChange={e => setConfig(p => ({ ...p, page_description: e.target.value }))}
                  placeholder="Uma breve descrição da seleção de cervejas..."
                  rows={3}
                />
              </div>
              <Button onClick={handleSaveConfig} disabled={savingConfig} className="gap-2">
                <Save className="h-4 w-4" />
                {savingConfig ? 'Salvando...' : 'Salvar cabeçalho'}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de cervejas */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Cervejas ({items.length})</p>
              <Button size="sm" onClick={() => { setCurrent(EMPTY_ITEM); setDialog('create') }} className="gap-2">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {items.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">Nenhuma cerveja cadastrada</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-3 p-3">
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          className="text-gray-300 hover:text-gray-500 disabled:opacity-20"
                          onClick={() => moveItem(index, -1)}
                          disabled={index === 0}
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="text-gray-300 hover:text-gray-500 disabled:opacity-20 rotate-180"
                          onClick={() => moveItem(index, 1)}
                          disabled={index === items.length - 1}
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0 bg-gray-100" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-gray-300 text-xs">sem img</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                        {item.description && <p className="text-xs text-gray-400 truncate mt-0.5">{item.description}</p>}
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

        {/* Preview */}
        {previewMode && (
          <div className="sticky top-4">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 bg-gray-50 border-b">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview — como ficará no site</p>
              </CardHeader>
              <CardContent className="p-0 overflow-auto max-h-[80vh]">
                <div style={{ fontFamily: 'sans-serif', background: '#fff' }}>
                  {/* Hero da seção */}
                  <div style={{ background: '#1a1a1a', color: '#fff', padding: '40px 24px', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px', color: '#c49018' }}>
                      {config.page_title || 'Nossas Cervejas'}
                    </h1>
                    {config.page_description && (
                      <p style={{ fontSize: '14px', color: '#aaa', maxWidth: '480px', margin: '0 auto' }}>
                        {config.page_description}
                      </p>
                    )}
                  </div>
                  {/* Grid de cervejas */}
                  <div style={{ padding: '32px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
                    {items.length === 0 ? (
                      <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
                        Nenhuma cerveja cadastrada ainda
                      </p>
                    ) : items.map(item => (
                      <div key={item.id} style={{ borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', background: '#fff' }}>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '160px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '12px' }}>
                            sem imagem
                          </div>
                        )}
                        <div style={{ padding: '12px' }}>
                          <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: '#1a1a1a' }}>{item.name}</p>
                          {item.description && (
                            <p style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
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
              <Label>Descrição</Label>
              <Textarea
                value={current.description}
                onChange={e => setCurrent(p => ({ ...p, description: e.target.value }))}
                placeholder="Uma breve descrição da cerveja..."
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Imagem</Label>
              <div className="flex gap-3 items-start">
                {current.image_url ? (
                  <img src={current.image_url} alt="preview" className="w-20 h-20 rounded-lg object-cover bg-gray-100 shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-gray-300 text-xs text-center leading-tight p-1">sem imagem</div>
                )}
                <div className="space-y-2 flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? 'Enviando...' : 'Fazer upload'}
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleUploadImage(e.target.files?.[0])}
                  />
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
            <AlertDescription>Remover <strong>"{current.name}"</strong> da lista? Esta ação não pode ser desfeita.</AlertDescription>
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
