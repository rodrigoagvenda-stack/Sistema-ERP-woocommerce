import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function Companies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setCompanies(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Empresas</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gerencie os clientes da plataforma</p>
        </div>
        <Button
          onClick={() => navigate('/super-admin/companies/new')}
          className="gap-2 bg-white text-gray-900 hover:bg-gray-100"
        >
          <Plus className="h-4 w-4" />
          Nova empresa
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-20 text-center text-gray-500 text-sm">Carregando...</div>
      ) : companies.length === 0 ? (
        <div className="py-20 text-center text-gray-500 text-sm">Nenhuma empresa cadastrada.</div>
      ) : (
        <div className="space-y-2">
          {companies.map(c => (
            <div
              key={c.id}
              className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl px-5 py-4"
            >
              {/* Logo */}
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                {c.logo_url
                  ? <img src={c.logo_url} alt={c.name} className="w-full h-full object-contain p-1" />
                  : <Building2 className="w-5 h-5 text-gray-500" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{c.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  {/* Color swatch */}
                  <span
                    className="w-3 h-3 rounded-full border border-gray-700"
                    style={{ backgroundColor: c.primary_color || '#15A344' }}
                  />
                  {/* Features */}
                  <div className="flex items-center gap-1.5">
                    {[
                      { key: 'feature_payments', label: 'Pagamentos' },
                      { key: 'feature_shipping', label: 'Frete' },
                      { key: 'feature_coupons',  label: 'Cupons' },
                      { key: 'feature_site',     label: 'Site' },
                    ].map(f => (
                      <span
                        key={f.key}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          c[f.key]
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-gray-800 text-gray-600'
                        }`}
                      >
                        {f.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Edit */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={() => navigate(`/super-admin/companies/${c.id}`)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
