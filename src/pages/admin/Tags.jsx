import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Globe, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api, wooProxy } from '@/lib/api'
import Pagination, { paginate } from '@/components/Pagination'

const EMPTY = { name: '', slug: '' }

export default function Tags() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [current, setCurrent] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(null)
  const [page, setPage] = useState(1)

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { setTags(await api.getAllTags()) }
    catch (e) { showAlert('error', e.message) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!current.name?.trim()) return showAlert('error', 'Nome é obrigatório')
    setSaving(true)
    try {
      const payload = {
        name: current.name.trim(),
        slug: current.slug?.trim() || current.name.toLowerCase().replace(/\s+/g, '-'),
      }
      if (dialog === 'create') {
        const created = await api.createTag(payload)
        setTags(prev => [...prev, created])
        showAlert('success', `Tag "${created.name}" criada!`)
      } else {
        const updated = await api.updateTag(current.id, payload)
        setTags(prev => prev.map(t => t.id === updated.id ? updated : t))
        if (current.woo_id) {
          try {
            await wooProxy({ method: 'PUT', endpoint: `products/tags/${current.woo_id}`, body: { name: payload.name, slug: payload.slug } })
            showAlert('success', `Tag "${updated.name}" atualizada e sincronizada!`)
          } catch {
            showAlert('success', `Tag "${updated.name}" atualizada no ERP.`)
          }
        } else {
          showAlert('success', `Tag "${updated.name}" atualizada!`)
        }
      }
      setDialog(null); setCurrent(EMPTY)
    } catch (e) {
      showAlert('error', 'Erro: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      if (current.woo_id) {
        try { await wooProxy({ method: 'DELETE', endpoint: `products/tags/${current.woo_id}?force=true` }) } catch {}
      }
      await api.deleteTag(current.id)
      setTags(prev => prev.filter(t => t.id !== current.id))
      showAlert('success', `Tag "${current.name}" excluída.`)
      setDialog(null); setCurrent(EMPTY)
    } catch (e) {
      showAlert('error', 'Erro: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async (tag) => {
    setSyncing(tag.id)
    try {
      let wooData
      if (tag.woo_id) {
        wooData = await wooProxy({ method: 'PUT', endpoint: `products/tags/${tag.woo_id}`, body: { name: tag.name, slug: tag.slug } })
      } else {
        wooData = await wooProxy({ method: 'POST', endpoint: 'products/tags', body: { name: tag.name, slug: tag.slug } })
      }
      await api.updateTag(tag.id, { woo_id: wooData.id })
      setTags(prev => prev.map(t => t.id === tag.id ? { ...t, woo_id: wooData.id } : t))
      showAlert('success', `Tag sincronizada! ID Woo: ${wooData.id}`)
    } catch (e) {
      showAlert('error', 'Erro ao sincronizar: ' + e.message)
    } finally {
      setSyncing(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tags</h1>
          <p className="text-sm text-gray-500">{tags.length} tags cadastradas</p>
        </div>
        <Button onClick={() => { setCurrent(EMPTY); setDialog('create') }} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Tag
        </Button>
      </div>

      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'success'}>
          {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div> :
            tags.length === 0 ? <div className="p-8 text-center text-gray-400 text-sm">Nenhuma tag cadastrada</div> : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Woo ID</TableHead>
                        <TableHead className="w-28" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginate(tags, page).map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium text-sm">{t.name}</TableCell>
                          <TableCell className="text-sm text-gray-500">{t.slug || '—'}</TableCell>
                          <TableCell>{t.woo_id ? <Badge variant="info">{t.woo_id}</Badge> : <span className="text-gray-400 text-xs">—</span>}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-400 hover:text-blue-600" onClick={() => handleSync(t)} disabled={syncing === t.id}>
                                {syncing === t.id ? <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setCurrent({ ...t }); setDialog('edit') }}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => { setCurrent(t); setDialog('delete') }}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {paginate(tags, page).map(t => (
                    <div key={t.id} className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <span className="text-gray-500 font-bold text-sm">#</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{t.slug || '—'}</p>
                        {t.woo_id && <Badge variant="info" className="text-xs mt-1">Woo #{t.woo_id}</Badge>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400" onClick={() => handleSync(t)} disabled={syncing === t.id}>
                          {syncing === t.id ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <Globe className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setCurrent({ ...t }); setDialog('edit') }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => { setCurrent(t); setDialog('delete') }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
        </CardContent>
      </Card>

      <Dialog open={dialog === 'create' || dialog === 'edit'} onOpenChange={() => { setDialog(null); setCurrent(EMPTY) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{dialog === 'create' ? 'Nova Tag' : 'Editar Tag'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={current.name} onChange={e => setCurrent(p => ({ ...p, name: e.target.value }))} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={current.slug || ''} onChange={e => setCurrent(p => ({ ...p, slug: e.target.value }))} placeholder="gerado-automaticamente" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialog(null); setCurrent(EMPTY) }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : (dialog === 'create' ? 'Criar' : 'Salvar')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'delete'} onOpenChange={() => { setDialog(null); setCurrent(EMPTY) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir Tag</DialogTitle></DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Excluir <strong>"{current.name}"</strong>? Esta ação não pode ser desfeita.</AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialog(null); setCurrent(EMPTY) }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>{saving ? 'Excluindo...' : 'Excluir'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
