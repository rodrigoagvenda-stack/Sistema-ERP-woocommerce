import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Building2, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function CopyUrl({ slug }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/login/${slug}`

  const handleCopy = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors text-[11px] text-gray-400 hover:text-white font-mono"
      title="Copiar URL de acesso"
    >
      {copied
        ? <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">Copiado</span></>
        : <><Copy className="w-3 h-3" />/login/{slug}</>
      }
    </button>
  )
}

export default function Companies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('companies')
      .select('*')
      .eq('has_woocommerce', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setCompanies(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Gestão</p>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Empresas</h1>
        </div>
        <button
          onClick={() => navigate('/super-admin/companies/new')}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova empresa
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-5 h-5 border-2 border-gray-700 border-t-gray-400 rounded-full animate-spin" />
        </div>
      ) : companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-sm text-gray-500">Nenhuma empresa cadastrada</p>
          <button
            onClick={() => navigate('/super-admin/companies/new')}
            className="text-xs text-gray-400 hover:text-white transition-colors underline underline-offset-2"
          >
            Criar primeira empresa
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-800/60">
          {companies.map(c => (
            <div
              key={c.id}
              className="group flex items-center gap-4 py-4 cursor-pointer"
              onClick={() => navigate(`/super-admin/companies/${c.id}`)}
            >
              {/* Logo */}
              <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700/50 flex items-center justify-center shrink-0 overflow-hidden">
                {c.logo_url
                  ? <img src={c.logo_url} alt={c.name} className="w-full h-full object-contain p-1.5" />
                  : <span className="text-sm font-semibold text-gray-400">{c.name[0]}</span>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-white">{c.name}</p>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.primary_color || '#15A344' }} />
                  <div className="flex items-center gap-1">
                    {[
                      { key: 'feature_payments', label: 'Pagamentos' },
                      { key: 'feature_shipping', label: 'Frete' },
                      { key: 'feature_coupons',  label: 'Cupons' },
                      { key: 'feature_site',     label: 'Site' },
                    ].filter(f => c[f.key]).map(f => (
                      <span key={f.key} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 font-medium">
                        {f.label}
                      </span>
                    ))}
                  </div>
                </div>
                {c.slug && <CopyUrl slug={c.slug} />}
              </div>

              {/* Edit */}
              <button
                onClick={e => { e.stopPropagation(); navigate(`/super-admin/companies/${c.id}`) }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-gray-800"
              >
                <Pencil className="h-3.5 w-3.5 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
