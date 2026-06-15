import { useState, useEffect } from 'react'
import { Plus, Trash2, RefreshCw, BadgePercent, Pencil, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { getCompanyId } from '@/lib/company'

const TYPES = [
  { value: 'percent',       label: '% Desconto' },
  { value: 'fixed',         label: 'R$ Fixo' },
  { value: 'free_shipping', label: 'Frete grátis' },
]

const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

const emptyForm = { code: '', discount_type: 'percent', discount_value: '', kit_id: '', expires_at: '', max_uses: '', active: true }

function CouponBadge({ type, value }) {
  if (type === 'free_shipping') return <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Frete grátis</span>
  if (type === 'percent')       return <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">{value}% off</span>
  return <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">-{fmt(value)}</span>
}

export default function Cupons() {
  const [coupons,   setCoupons]   = useState([])
  const [kits,      setKits]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [companyId, setCompanyId] = useState(null)
  const [alert,     setAlert]     = useState(null)
  const [form,      setForm]      = useState(emptyForm)
  const [editing,   setEditing]   = useState(null)
  const [editForm,  setEditForm]  = useState(null)

  const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 4000) }

  const load = async () => {
    setLoading(true)
    try {
      const cid = await getCompanyId()
      setCompanyId(cid)
      const [{ data: c }, { data: k }] = await Promise.all([
        supabase.from('coupons').select('*').eq('company_id', cid).order('created_at', { ascending: false }),
        supabase.from('kits').select('id,name').eq('company_id', cid).eq('active', true),
      ])
      setCoupons(c || [])
      setKits(k || [])
    } catch (e) { showAlert('error', e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const setE = (k, v) => setEditForm(prev => ({ ...prev, [k]: v }))

  const handleCreate = async () => {
    if (!form.code.trim()) return showAlert('error', 'Código obrigatório.')
    if (form.discount_type !== 'free_shipping' && !form.discount_value) return showAlert('error', 'Valor do desconto obrigatório.')
    setSaving(true)
    try {
      const cid = await getCompanyId()
      const payload = {
        company_id:     cid,
        code:           form.code.trim().toUpperCase(),
        discount_type:  form.discount_type,
        discount_value: form.discount_type === 'free_shipping' ? 0 : parseFloat(form.discount_value),
        kit_id:         form.kit_id || null,
        expires_at:     form.expires_at || null,
        max_uses:       form.max_uses ? parseInt(form.max_uses) : null,
        active:         true,
      }
      const { data, error } = await supabase.from('coupons').insert(payload).select()
      if (error) throw error
      setCoupons(prev => [data[0], ...prev])
      setForm(emptyForm)
      showAlert('success', 'Cupom criado!')
    } catch (e) { showAlert('error', e.message) }
    finally { setSaving(false) }
  }

  const startEdit = (c) => { setEditing(c.id); setEditForm({ ...c, expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '', max_uses: c.max_uses ?? '' }) }
  const cancelEdit = () => { setEditing(null); setEditForm(null) }

  const handleSave = async (id) => {
    try {
      const payload = {
        code:           editForm.code.trim().toUpperCase(),
        discount_type:  editForm.discount_type,
        discount_value: editForm.discount_type === 'free_shipping' ? 0 : parseFloat(editForm.discount_value),
        kit_id:         editForm.kit_id || null,
        expires_at:     editForm.expires_at || null,
        max_uses:       editForm.max_uses ? parseInt(editForm.max_uses) : null,
        active:         editForm.active,
      }
      const { error } = await supabase.from('coupons').update(payload).eq('id', id)
      if (error) throw error
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, ...payload } : c))
      cancelEdit()
      showAlert('success', 'Cupom atualizado!')
    } catch (e) { showAlert('error', e.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Excluir este cupom?')) return
    await supabase.from('coupons').delete().eq('id', id)
    setCoupons(prev => prev.filter(c => c.id !== id))
  }

  const toggleActive = async (c) => {
    await supabase.from('coupons').update({ active: !c.active }).eq('id', c.id)
    setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, active: !x.active } : x))
  }

  const kitName = (kid) => kits.find(k => k.id === kid)?.name || 'Todos os kits'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Cupons de Desconto</h1>
        <p className="text-sm text-gray-500">Crie cupons que os clientes digitam antes de comprar um kit. Podem ser % off, valor fixo ou frete grátis.</p>
      </div>

      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{alert.msg}</AlertDescription>
        </Alert>
      )}

      {/* Criar cupom */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Novo cupom</CardTitle>
          <CardDescription>O cliente digita o código na landing page e o desconto é aplicado automaticamente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Código</Label>
              <Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="BEMVINDO10" className="text-sm font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <select value={form.discount_type} onChange={e => set('discount_type', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {form.discount_type !== 'free_shipping' && (
              <div className="space-y-1.5">
                <Label className="text-xs">{form.discount_type === 'percent' ? 'Percentual (%)' : 'Valor (R$)'}</Label>
                <Input value={form.discount_value} onChange={e => set('discount_value', e.target.value)} placeholder={form.discount_type === 'percent' ? '10' : '30.00'} type="number" step="0.01" className="text-sm" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Kit específico (opcional)</Label>
              <select value={form.kit_id} onChange={e => set('kit_id', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Todos os kits</option>
                {kits.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Validade (opcional)</Label>
              <Input value={form.expires_at} onChange={e => set('expires_at', e.target.value)} type="date" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Limite de usos (opcional)</Label>
              <Input value={form.max_uses} onChange={e => set('max_uses', e.target.value)} placeholder="100" type="number" className="text-sm" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={saving} className="gap-2">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? 'Criando...' : 'Criar cupom'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      {loading ? (
        <div className="text-sm text-gray-400 text-center py-8">Carregando...</div>
      ) : coupons.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-8">Nenhum cupom criado ainda.</div>
      ) : (
        <div className="space-y-3">
          {coupons.map(c => (
            <Card key={c.id} className={!c.active ? 'opacity-50' : ''}>
              <CardContent className="pt-4">
                {editing === c.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Código</Label>
                        <Input value={editForm.code} onChange={e => setE('code', e.target.value.toUpperCase())} className="text-sm font-mono h-8" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tipo</Label>
                        <select value={editForm.discount_type} onChange={e => setE('discount_type', e.target.value)} className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm">
                          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      {editForm.discount_type !== 'free_shipping' && (
                        <div className="space-y-1">
                          <Label className="text-xs">Valor</Label>
                          <Input value={editForm.discount_value} onChange={e => setE('discount_value', e.target.value)} type="number" step="0.01" className="text-sm h-8" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <Label className="text-xs">Kit</Label>
                        <select value={editForm.kit_id || ''} onChange={e => setE('kit_id', e.target.value)} className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm">
                          <option value="">Todos</option>
                          {kits.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Validade</Label>
                        <Input value={editForm.expires_at} onChange={e => setE('expires_at', e.target.value)} type="date" className="text-sm h-8" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Limite usos</Label>
                        <Input value={editForm.max_uses} onChange={e => setE('max_uses', e.target.value)} type="number" className="text-sm h-8" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Ativo</Label>
                        <select value={editForm.active ? 'true' : 'false'} onChange={e => setE('active', e.target.value === 'true')} className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm">
                          <option value="true">Sim</option>
                          <option value="false">Não</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1"><X className="h-3.5 w-3.5" />Cancelar</Button>
                      <Button size="sm" onClick={() => handleSave(c.id)} className="gap-1"><Check className="h-3.5 w-3.5" />Salvar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <BadgePercent className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono font-bold text-gray-800">{c.code}</p>
                          <CouponBadge type={c.discount_type} value={c.discount_value} />
                          {!c.active && <span className="text-xs text-gray-400 italic">inativo</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {kitName(c.kit_id)}
                          {c.expires_at && ` · expira ${new Date(c.expires_at).toLocaleDateString('pt-BR')}`}
                          {c.max_uses && ` · ${c.uses_count}/${c.max_uses} usos`}
                          {!c.max_uses && ` · ${c.uses_count} usos`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => toggleActive(c)} className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors text-xs px-2">
                        {c.active ? 'Desativar' : 'Ativar'}
                      </button>
                      <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
