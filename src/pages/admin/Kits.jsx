import { useState, useEffect } from 'react'
import { Plus, Trash2, Copy, Check, RefreshCw, ShoppingBag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { getCompanyId } from '@/lib/company'

const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

function buildSnippet(kit, companyId) {
  return `<!-- Botão Kit: ${kit.name} -->
<button onclick="comprarKit(this,'${kit.id}','${companyId}')" style="cursor:pointer">
  Comprar — ${fmt(kit.price)}
</button>
<script>
async function comprarKit(btn,kitId,companyId){
  const t=btn.textContent;btn.disabled=true;btn.textContent='Aguarde...';
  try{
    const r=await fetch('${SUPABASE_URL}/functions/v1/mp-preference',{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':'${SUPABASE_ANON}'},
      body:JSON.stringify({kit_id:kitId,company_id:companyId})
    });
    const d=await r.json();
    if(d.error)throw new Error(d.error);
    window.open(d.url,'_blank');
  }catch(e){alert('Erro: '+e.message);}
  finally{btn.disabled=false;btn.textContent=t;}
}
<\/script>`
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button variant="outline" size="sm" onClick={copy} className="gap-1.5 shrink-0">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copiado!' : 'Copiar código'}
    </Button>
  )
}

export default function Kits() {
  const [kits,      setKits]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [companyId, setCompanyId] = useState(null)
  const [alert,     setAlert]     = useState(null)
  const [form,      setForm]      = useState({ name: '', price: '', success_url: '' })

  const showAlert = (type, msg) => {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 4000)
  }

  const load = async () => {
    setLoading(true)
    try {
      const cid = await getCompanyId()
      setCompanyId(cid)
      const { data } = await supabase
        .from('kits')
        .select('*')
        .eq('company_id', cid)
        .order('created_at', { ascending: true })
      setKits(data || [])
    } catch (e) { showAlert('error', e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.price) return showAlert('error', 'Nome e preço são obrigatórios.')
    setSaving(true)
    try {
      const cid = await getCompanyId()
      const { data, error } = await supabase
        .from('kits')
        .insert({ company_id: cid, name: form.name.trim(), price: parseFloat(form.price), success_url: form.success_url || null, active: true })
        .select()
      if (error) throw error
      setKits(prev => [...prev, data[0]])
      setForm({ name: '', price: '', success_url: '' })
      showAlert('success', 'Kit criado!')
    } catch (e) { showAlert('error', e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Excluir este kit?')) return
    await supabase.from('kits').delete().eq('id', id)
    setKits(prev => prev.filter(k => k.id !== id))
  }

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Kits de Venda</h1>
        <p className="text-sm text-gray-500">Crie kits com checkout direto via Mercado Pago. Cada kit gera um botão para colar na sua landing page.</p>
      </div>

      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{alert.msg}</AlertDescription>
        </Alert>
      )}

      {/* Criar kit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Novo kit</CardTitle>
          <CardDescription>O cliente clica no botão e vai direto para o checkout do Mercado Pago numa nova aba.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-1">
              <Label className="text-xs">Nome do kit</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Kit 3 Frascos" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Preço (R$)</Label>
              <Input value={form.price} onChange={e => set('price', e.target.value)} placeholder="605.00" type="number" step="0.01" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">URL de retorno após pagamento (opcional)</Label>
              <Input value={form.success_url} onChange={e => set('success_url', e.target.value)} placeholder="https://seusite.com/obrigado" className="text-sm" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={saving} className="gap-2">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? 'Criando...' : 'Criar kit'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de kits */}
      {loading ? (
        <div className="text-sm text-gray-400 text-center py-8">Carregando...</div>
      ) : kits.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-8">Nenhum kit criado ainda.</div>
      ) : (
        <div className="space-y-4">
          {kits.map(kit => (
            <Card key={kit.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <ShoppingBag className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{kit.name}</p>
                      <p className="text-xs text-gray-400">{fmt(kit.price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CopyButton text={buildSnippet(kit, companyId)} />
                    <button onClick={() => handleDelete(kit.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Código para colar no WordPress (bloco HTML)</p>
                  <pre className="text-[11px] text-gray-600 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                    {buildSnippet(kit, companyId)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
