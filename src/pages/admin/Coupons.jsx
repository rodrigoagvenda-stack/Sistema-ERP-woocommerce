import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, CheckCircle2, AlertCircle, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { wooProxy } from '@/lib/api'

const EMPTY = {
  code: '',
  discount_type: 'percent',
  amount: '',
  date_expires: '',
  minimum_amount: '',
  maximum_amount: '',
  usage_limit: '',
  usage_limit_per_user: '',
  individual_use: false,
  free_shipping: false,
}

const TYPE_LABELS = {
  percent: 'Percentual (%)',
  fixed_cart: 'Valor fixo no carrinho (R$)',
  fixed_product: 'Valor fixo no produto (R$)',
}

const TYPE_BADGE = {
  percent: 'secondary',
  fixed_cart: 'info',
  fixed_product: 'info',
}

export default function Coupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [dialog, setDialog] = useState(null) // 'create' | 'edit' | 'delete'
  const [current, setCurrent] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  useEffect(() => { load(1) }, [])

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const data = await wooProxy({ method: 'GET', endpoint: `coupons?per_page=50&page=${p}` })
      if (p === 1) setCoupons(data)
      else setCoupons(prev => [...prev, ...data])
      setHasMore(data.length === 50)
      setPage(p)
    } catch (e) {
      showAlert('error', 'Erro ao carregar cupons: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const buildPayload = () => ({
    code: current.code.trim().toLowerCase(),
    discount_type: current.discount_type,
    amount: current.amount?.toString() || '0',
    ...(current.date_expires ? { date_expires: current.date_expires } : { date_expires: '' }),
    ...(current.minimum_amount ? { minimum_amount: current.minimum_amount.toString() } : {}),
    ...(current.maximum_amount ? { maximum_amount: current.maximum_amount.toString() } : {}),
    ...(current.usage_limit ? { usage_limit: parseInt(current.usage_limit) } : { usage_limit: null }),
    ...(current.usage_limit_per_user ? { usage_limit_per_user: parseInt(current.usage_limit_per_user) } : { usage_limit_per_user: null }),
    individual_use: current.individual_use,
    free_shipping: current.free_shipping,
  })

  const handleSave = async () => {
    if (!current.code?.trim()) return showAlert('error', 'Código do cupom é obrigatório')
    if (!current.amount && !current.free_shipping) return showAlert('error', 'Informe o valor do desconto')
    setSaving(true)
    try {
      const payload = buildPayload()
      let result
      if (dialog === 'create') {
        result = await wooProxy({ method: 'POST', endpoint: 'coupons', body: payload })
        setCoupons(prev => [result, ...prev])
        showAlert('success', `Cupom "${result.code}" criado!`)
      } else {
        result = await wooProxy({ method: 'PUT', endpoint: `coupons/${current.id}`, body: payload })
        setCoupons(prev => prev.map(c => c.id === result.id ? result : c))
        showAlert('success', `Cupom "${result.code}" atualizado!`)
      }
      setDialog(null)
      setCurrent(EMPTY)
    } catch (e) {
      showAlert('error', 'Erro: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await wooProxy({ method: 'DELETE', endpoint: `coupons/${current.id}?force=true` })
      setCoupons(prev => prev.filter(c => c.id !== current.id))
      showAlert('success', `Cupom "${current.code}" excluído.`)
      setDialog(null)
      setCurrent(EMPTY)
    } catch (e) {
      showAlert('error', 'Erro ao excluir: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (c) => {
    setCurrent({
      id: c.id,
      code: c.code,
      discount_type: c.discount_type,
      amount: c.amount,
      date_expires: c.date_expires ? c.date_expires.substring(0, 10) : '',
      minimum_amount: c.minimum_amount || '',
      maximum_amount: c.maximum_amount || '',
      usage_limit: c.usage_limit || '',
      usage_limit_per_user: c.usage_limit_per_user || '',
      individual_use: c.individual_use,
      free_shipping: c.free_shipping,
    })
    setDialog('edit')
  }

  const formatAmount = (coupon) => {
    if (!coupon.amount || coupon.amount === '0') return '—'
    if (coupon.discount_type === 'percent') return `${coupon.amount}%`
    return `R$ ${parseFloat(coupon.amount).toFixed(2)}`
  }

  const formatExpiry = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  const isExpired = (dateStr) => {
    if (!dateStr) return false
    return new Date(dateStr) < new Date()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cupons</h1>
          <p className="text-sm text-gray-500">{coupons.length} cupons cadastrados no WooCommerce</p>
        </div>
        <Button onClick={() => { setCurrent(EMPTY); setDialog('create') }} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Cupom
        </Button>
      </div>

      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
          {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Carregando cupons do WooCommerce...</div>
          ) : coupons.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Nenhum cupom cadastrado</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Desconto</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Usos</TableHead>
                      <TableHead>Flags</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map(c => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <span className="font-mono font-semibold text-sm uppercase">{c.code}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={TYPE_BADGE[c.discount_type] || 'secondary'} className="text-xs">
                            {TYPE_LABELS[c.discount_type] || c.discount_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{formatAmount(c)}</TableCell>
                        <TableCell>
                          <span className={`text-sm ${isExpired(c.date_expires) ? 'text-red-500' : 'text-gray-600'}`}>
                            {formatExpiry(c.date_expires)}
                            {isExpired(c.date_expires) && ' (expirado)'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {c.usage_count || 0}
                          {c.usage_limit ? ` / ${c.usage_limit}` : ' / ∞'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {c.free_shipping && <Badge variant="outline" className="text-xs">Frete grátis</Badge>}
                            {c.individual_use && <Badge variant="outline" className="text-xs">Individual</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => { setCurrent(c); setDialog('delete') }}>
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
                {coupons.map(c => (
                  <div key={c.id} className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Ticket className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-semibold text-sm text-gray-900 uppercase">{c.code}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {TYPE_LABELS[c.discount_type]} · {formatAmount(c)}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.free_shipping && <Badge variant="outline" className="text-xs">Frete grátis</Badge>}
                        {c.individual_use && <Badge variant="outline" className="text-xs">Individual</Badge>}
                        {isExpired(c.date_expires) && <Badge variant="destructive" className="text-xs">Expirado</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => { setCurrent(c); setDialog('delete') }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="p-4 text-center border-t">
                  <Button variant="outline" size="sm" onClick={() => load(page + 1)} disabled={loading}>
                    Carregar mais
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialog === 'create' || dialog === 'edit'} onOpenChange={() => { setDialog(null); setCurrent(EMPTY) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog === 'create' ? 'Novo Cupom' : 'Editar Cupom'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {/* Código */}
            <div className="space-y-1.5">
              <Label>Código do cupom *</Label>
              <Input
                value={current.code}
                onChange={e => setCurrent(p => ({ ...p, code: e.target.value }))}
                placeholder="EX: DESCONTO10"
                className="font-mono uppercase"
                autoFocus
              />
            </div>

            {/* Tipo + Valor */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo de desconto *</Label>
                <Select value={current.discount_type} onValueChange={v => setCurrent(p => ({ ...p, discount_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentual (%)</SelectItem>
                    <SelectItem value="fixed_cart">Valor fixo no carrinho</SelectItem>
                    <SelectItem value="fixed_product">Valor fixo no produto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>
                  {current.discount_type === 'percent' ? 'Valor (%)' : 'Valor (R$)'}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step={current.discount_type === 'percent' ? '1' : '0.01'}
                  value={current.amount}
                  onChange={e => setCurrent(p => ({ ...p, amount: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Validade */}
            <div className="space-y-1.5">
              <Label>Data de expiração</Label>
              <Input
                type="date"
                value={current.date_expires}
                onChange={e => setCurrent(p => ({ ...p, date_expires: e.target.value }))}
              />
            </div>

            {/* Valor mínimo / máximo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor mínimo do pedido (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={current.minimum_amount}
                  onChange={e => setCurrent(p => ({ ...p, minimum_amount: e.target.value }))}
                  placeholder="Sem mínimo"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Valor máximo do pedido (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={current.maximum_amount}
                  onChange={e => setCurrent(p => ({ ...p, maximum_amount: e.target.value }))}
                  placeholder="Sem máximo"
                />
              </div>
            </div>

            {/* Limite de uso */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Limite de usos total</Label>
                <Input
                  type="number"
                  min="0"
                  value={current.usage_limit}
                  onChange={e => setCurrent(p => ({ ...p, usage_limit: e.target.value }))}
                  placeholder="Ilimitado"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Limite por usuário</Label>
                <Input
                  type="number"
                  min="0"
                  value={current.usage_limit_per_user}
                  onChange={e => setCurrent(p => ({ ...p, usage_limit_per_user: e.target.value }))}
                  placeholder="Ilimitado"
                />
              </div>
            </div>

            {/* Switches */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Frete grátis</p>
                  <p className="text-xs text-gray-500">Libera frete grátis ao usar o cupom</p>
                </div>
                <Switch
                  checked={current.free_shipping}
                  onCheckedChange={v => setCurrent(p => ({ ...p, free_shipping: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Uso individual</p>
                  <p className="text-xs text-gray-500">Não pode ser combinado com outros cupons</p>
                </div>
                <Switch
                  checked={current.individual_use}
                  onCheckedChange={v => setCurrent(p => ({ ...p, individual_use: v }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialog(null); setCurrent(EMPTY) }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : (dialog === 'create' ? 'Criar Cupom' : 'Salvar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={dialog === 'delete'} onOpenChange={() => { setDialog(null); setCurrent(EMPTY) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir Cupom</DialogTitle></DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Excluir o cupom <strong className="font-mono uppercase">"{current.code}"</strong>? Esta ação não pode ser desfeita.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialog(null); setCurrent(EMPTY) }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
