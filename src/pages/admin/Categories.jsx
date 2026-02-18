import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Globe, CheckCircle2, AlertCircle } from 'lucide-react'
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

const EMPTY = { name: '', slug: '', status: 'active', parent_id: null, woo_id: null }

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [current, setCurrent] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(null)

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
      }
      if (dialog === 'create') {
        const created = await api.createCategory(payload)
        setCategories(prev => [...prev, created])
        showAlert('success', `Categoria "${created.name}" criada!`)
      } else {
        const updated = await api.updateCategory(current.id, payload)
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c))
        if (current.woo_id) {
          try {
            await wooProxy({ method: 'PUT', endpoint: `products/categories/${current.woo_id}`, body: { name: payload.name, slug: payload.slug } })
            showAlert('success', `Categoria "${updated.name}" atualizada e sincronizada!`)
          } catch {
            showAlert('success', `Categoria "${updated.name}" atualizada no ERP.`)
          }
        } else {
          showAlert('success', `Categoria "${updated.name}" atualizada!`)
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

  const handleSync = async (cat) => {
    setSyncing(cat.id)
    try {
      let wooData
      if (cat.woo_id) {
        wooData = await wooProxy({ method: 'PUT', endpoint: `products/categories/${cat.woo_id}`, body: { name: cat.name, slug: cat.slug } })
      } else {
        const body = { name: cat.name, slug: cat.slug }
        if (cat.parent_id) {
          const parent = categories.find(c => c.id === cat.parent_id)
          if (parent?.woo_id) body.parent = parent.woo_id
        }
        wooData = await wooProxy({ method: 'POST', endpoint: 'products/categories', body })
      }
      const updated = await api.updateCategory(cat.id, { woo_id: wooData.id })
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, woo_id: wooData.id } : c))
      showAlert('success', `Categoria sincronizada! ID Woo: ${wooData.id}`)
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
          <h1 className="text-xl font-bold text-gray-900">Categorias</h1>
          <p className="text-sm text-gray-500">{categories.length} categorias</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Categoria
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
                        <TableCell className="font-medium text-sm">{c.name}</TableCell>
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
                    <div className="w-10 h-10 rounded-lg bg-[#f4b522]/10 flex items-center justify-center shrink-0">
                      <span className="text-[#c49018] font-bold text-sm">{c.name[0]?.toUpperCase()}</span>
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
