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

const EMPTY = { name: '', slug: '' }

export default function Brands() {
  const [brands, setBrands] = useState([])
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
    try { setBrands(await api.getAllBrands()) }
    catch (e) { showAlert('error', e.message) }
    finally { setLoading(false) }
  }

  const openCreate = () => { setCurrent(EMPTY); setDialog('create') }
  const openEdit = (b) => { setCurrent({ ...b }); setDialog('edit') }
  const openDelete = (b) => { setCurrent(b); setDialog('delete') }
  const closeDialog = () => { setDialog(null); setCurrent(EMPTY) }

  const handleSave = async () => {
    if (!current.name?.trim()) return showAlert('error', 'Nome é obrigatório')
    setSaving(true)
    try {
      const payload = {
        name: current.name.trim(),
        slug: current.slug?.trim() || current.name.toLowerCase().replace(/\s+/g, '-'),
      }
      if (dialog === 'create') {
        const created = await api.createBrand(payload)
        setBrands(prev => [...prev, created])
        showAlert('success', `Marca "${created.name}" criada!`)
      } else {
        const updated = await api.updateBrand(current.id, payload)
        setBrands(prev => prev.map(b => b.id === updated.id ? updated : b))
        showAlert('success', `Marca "${updated.name}" atualizada!`)
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
      await api.deleteBrand(current.id)
      setBrands(prev => prev.filter(b => b.id !== current.id))
      showAlert('success', `Marca "${current.name}" excluída.`)
      closeDialog()
    } catch (e) {
      showAlert('error', 'Erro ao excluir: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // Sync as WooCommerce global attribute term (pa_marca)
  const handleSync = async (brand) => {
    setSyncing(brand.id)
    try {
      // 1. Ensure pa_marca attribute exists
      let attrs = await wooProxy({ endpoint: 'products/attributes?slug=pa_marca' })
      let attrId
      if (Array.isArray(attrs) && attrs.length > 0) {
        attrId = attrs[0].id
      } else {
        const newAttr = await wooProxy({ method: 'POST', endpoint: 'products/attributes', body: { name: 'Marca', slug: 'pa_marca', type: 'select', has_archives: true } })
        attrId = newAttr.id
      }

      // 2. Create or update term
      let wooData
      if (brand.woo_id) {
        wooData = await wooProxy({ method: 'PUT', endpoint: `products/attributes/${attrId}/terms/${brand.woo_id}`, body: { name: brand.name, slug: brand.slug } })
      } else {
        wooData = await wooProxy({ method: 'POST', endpoint: `products/attributes/${attrId}/terms`, body: { name: brand.name, slug: brand.slug } })
      }

      await api.updateBrand(brand.id, { woo_id: wooData.id })
      setBrands(prev => prev.map(b => b.id === brand.id ? { ...b, woo_id: wooData.id } : b))
      showAlert('success', `Marca sincronizada! ID Woo: ${wooData.id}`)
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
          <h1 className="text-xl font-bold text-gray-900">Marcas</h1>
          <p className="text-sm text-gray-500">{brands.length} marcas cadastradas</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Nova Marca</Button>
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
            brands.length === 0 ? <div className="p-8 text-center text-gray-400 text-sm">Nenhuma marca cadastrada</div> : (
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
                      {brands.map(b => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium text-sm">{b.name}</TableCell>
                          <TableCell className="text-sm text-gray-500">{b.slug || '—'}</TableCell>
                          <TableCell>{b.woo_id ? <Badge variant="info">{b.woo_id}</Badge> : <span className="text-gray-400 text-xs">—</span>}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-400 hover:text-blue-600" onClick={() => handleSync(b)} disabled={syncing === b.id} title="Sync WooCommerce">
                                {syncing === b.id ? <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(b)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => openDelete(b)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {brands.map(b => (
                    <div key={b.id} className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#f4b522]/10 flex items-center justify-center shrink-0">
                        <span className="text-[#c49018] font-bold text-sm">{b.name[0]?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900">{b.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{b.slug || '—'}</p>
                        {b.woo_id && <Badge variant="info" className="text-xs mt-1">Woo #{b.woo_id}</Badge>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400" onClick={() => handleSync(b)} disabled={syncing === b.id}>
                          {syncing === b.id ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <Globe className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => openDelete(b)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
        </CardContent>
      </Card>

      <Dialog open={dialog === 'create' || dialog === 'edit'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{dialog === 'create' ? 'Nova Marca' : 'Editar Marca'}</DialogTitle></DialogHeader>
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
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : (dialog === 'create' ? 'Criar' : 'Salvar')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'delete'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir Marca</DialogTitle></DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Excluir <strong>"{current.name}"</strong>? Esta ação não pode ser desfeita.</AlertDescription>
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
