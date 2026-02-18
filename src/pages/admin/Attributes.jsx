import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Globe, ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api, wooProxy } from '@/lib/api'

export default function Attributes() {
  const [attributes, setAttributes] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [dialog, setDialog] = useState(null) // { type, mode, data }
  const [form, setForm] = useState({ name: '', slug: '' })
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [syncing, setSyncing] = useState(null)

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 5000)
  }

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { setAttributes(await api.getAllAttributes()) }
    catch (e) { showAlert('error', e.message) }
    finally { setLoading(false) }
  }

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  // ── Attribute CRUD ──────────────────────────────
  const handleSaveAttr = async () => {
    if (!form.name?.trim()) return showAlert('error', 'Nome é obrigatório')
    setSaving(true)
    try {
      const payload = { name: form.name.trim(), slug: form.slug?.trim() || form.name.toLowerCase().replace(/\s+/g, '_') }
      if (dialog.mode === 'create') {
        const created = await api.createAttribute(payload)
        setAttributes(prev => [...prev, { ...created, terms: [] }])
        showAlert('success', `Atributo "${created.name}" criado!`)
      } else {
        const updated = await api.updateAttribute(dialog.data.id, payload)
        setAttributes(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a))
        showAlert('success', `Atributo atualizado!`)
      }
      setDialog(null)
    } catch (e) { showAlert('error', e.message) }
    finally { setSaving(false) }
  }

  const handleDeleteAttr = async () => {
    setSaving(true)
    try {
      await api.deleteAttribute(dialog.data.id)
      setAttributes(prev => prev.filter(a => a.id !== dialog.data.id))
      showAlert('success', `Atributo "${dialog.data.name}" excluído.`)
      setDialog(null)
    } catch (e) { showAlert('error', e.message) }
    finally { setSaving(false) }
  }

  // ── Term CRUD ───────────────────────────────────
  const handleSaveTerm = async () => {
    if (!form.name?.trim()) return showAlert('error', 'Nome é obrigatório')
    setSaving(true)
    try {
      const payload = { attribute_id: dialog.attrId, name: form.name.trim(), slug: form.slug?.trim() || form.name.toLowerCase().replace(/\s+/g, '-') }
      if (dialog.mode === 'createTerm') {
        const created = await api.createAttributeTerm(payload)
        setAttributes(prev => prev.map(a => a.id === dialog.attrId ? { ...a, terms: [...(a.terms || []), created] } : a))
        showAlert('success', `Termo "${created.name}" criado!`)
      } else {
        const updated = await api.updateAttributeTerm(dialog.data.id, payload)
        setAttributes(prev => prev.map(a => a.id === dialog.attrId
          ? { ...a, terms: (a.terms || []).map(t => t.id === updated.id ? updated : t) } : a))
        showAlert('success', `Termo atualizado!`)
      }
      setDialog(null)
    } catch (e) { showAlert('error', e.message) }
    finally { setSaving(false) }
  }

  const handleDeleteTerm = async () => {
    setSaving(true)
    try {
      await api.deleteAttributeTerm(dialog.data.id)
      setAttributes(prev => prev.map(a => a.id === dialog.attrId
        ? { ...a, terms: (a.terms || []).filter(t => t.id !== dialog.data.id) } : a))
      showAlert('success', `Termo excluído.`)
      setDialog(null)
    } catch (e) { showAlert('error', e.message) }
    finally { setSaving(false) }
  }

  // ── Sync to WooCommerce ─────────────────────────
  const handleSyncAttr = async (attr) => {
    setSyncing(attr.id)
    try {
      let wooData
      if (attr.woo_id) {
        wooData = await wooProxy({ method: 'PUT', endpoint: `products/attributes/${attr.woo_id}`, body: { name: attr.name, slug: attr.slug } })
      } else {
        wooData = await wooProxy({ method: 'POST', endpoint: 'products/attributes', body: { name: attr.name, slug: attr.slug, type: 'select', has_archives: false } })
      }
      await api.updateAttribute(attr.id, { woo_id: wooData.id })
      setAttributes(prev => prev.map(a => a.id === attr.id ? { ...a, woo_id: wooData.id } : a))
      showAlert('success', `Atributo sincronizado! ID Woo: ${wooData.id}`)
    } catch (e) { showAlert('error', 'Erro ao sincronizar: ' + e.message) }
    finally { setSyncing(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Atributos</h1>
          <p className="text-sm text-gray-500">{attributes.length} atributos cadastrados</p>
        </div>
        <Button onClick={() => { setForm({ name: '', slug: '' }); setDialog({ type: 'attr', mode: 'create' }) }} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Atributo
        </Button>
      </div>

      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'success'}>
          {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {loading ? <Card><CardContent className="p-8 text-center text-gray-400 text-sm">Carregando...</CardContent></Card> :
          attributes.length === 0 ? <Card><CardContent className="p-8 text-center text-gray-400 text-sm">Nenhum atributo cadastrado</CardContent></Card> :
          attributes.map(attr => (
            <Card key={attr.id}>
              <CardContent className="p-0">
                {/* Attribute row */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                  <button onClick={() => toggleExpand(attr.id)} className="text-gray-400 hover:text-gray-600">
                    {expanded[attr.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <span className="font-medium text-sm flex-1">{attr.name}</span>
                  <span className="text-xs text-gray-400">{attr.slug}</span>
                  {attr.woo_id ? <Badge variant="info" className="text-xs">Woo: {attr.woo_id}</Badge> : null}
                  <Badge variant="secondary" className="text-xs">{(attr.terms || []).length} termos</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-400" onClick={() => handleSyncAttr(attr)} disabled={syncing === attr.id}>
                      {syncing === attr.id ? <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setForm({ name: attr.name, slug: attr.slug || '' }); setDialog({ type: 'attr', mode: 'edit', data: attr }) }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => setDialog({ type: 'attr', mode: 'delete', data: attr })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Terms */}
                {expanded[attr.id] && (
                  <div className="px-4 py-3 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Termos</span>
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => { setForm({ name: '', slug: '' }); setDialog({ type: 'term', mode: 'createTerm', attrId: attr.id }) }}>
                        <Plus className="h-3 w-3" /> Adicionar Termo
                      </Button>
                    </div>
                    {(attr.terms || []).length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">Nenhum termo</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs h-8">Nome</TableHead>
                            <TableHead className="text-xs h-8">Slug</TableHead>
                            <TableHead className="text-xs h-8">Woo ID</TableHead>
                            <TableHead className="w-20 h-8" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(attr.terms || []).map(term => (
                            <TableRow key={term.id}>
                              <TableCell className="text-sm py-2">{term.name}</TableCell>
                              <TableCell className="text-sm text-gray-400 py-2">{term.slug || '—'}</TableCell>
                              <TableCell className="py-2">{term.woo_id ? <Badge variant="info" className="text-xs">{term.woo_id}</Badge> : <span className="text-gray-400 text-xs">—</span>}</TableCell>
                              <TableCell className="py-2">
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setForm({ name: term.name, slug: term.slug || '' }); setDialog({ type: 'term', mode: 'editTerm', attrId: attr.id, data: term }) }}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => setDialog({ type: 'term', mode: 'deleteTerm', attrId: attr.id, data: term })}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Attribute Create/Edit */}
      <Dialog open={dialog?.type === 'attr' && (dialog?.mode === 'create' || dialog?.mode === 'edit')} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{dialog?.mode === 'create' ? 'Novo Atributo' : 'Editar Atributo'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus /></div>
            <div className="space-y-1.5"><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="gerado-automaticamente" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancelar</Button>
            <Button onClick={handleSaveAttr} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attribute Delete */}
      <Dialog open={dialog?.type === 'attr' && dialog?.mode === 'delete'} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir Atributo</DialogTitle></DialogHeader>
          <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>Excluir <strong>"{dialog?.data?.name}"</strong> e todos seus termos?</AlertDescription></Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteAttr} disabled={saving}>{saving ? 'Excluindo...' : 'Excluir'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Term Create/Edit */}
      <Dialog open={dialog?.type === 'term' && (dialog?.mode === 'createTerm' || dialog?.mode === 'editTerm')} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{dialog?.mode === 'createTerm' ? 'Novo Termo' : 'Editar Termo'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus /></div>
            <div className="space-y-1.5"><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancelar</Button>
            <Button onClick={handleSaveTerm} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Term Delete */}
      <Dialog open={dialog?.type === 'term' && dialog?.mode === 'deleteTerm'} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir Termo</DialogTitle></DialogHeader>
          <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>Excluir o termo <strong>"{dialog?.data?.name}"</strong>?</AlertDescription></Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteTerm} disabled={saving}>{saving ? 'Excluindo...' : 'Excluir'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
