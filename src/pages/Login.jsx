import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Login() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [company, setCompany] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Detecta redirect OAuth do Bling
  useEffect(() => {
    const code = searchParams.get('code')
    if (!code || !slug) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(`/admin/${slug}/integrations?bling_code=${code}`, { replace: true })
      } else {
        sessionStorage.setItem('bling_oauth_code', code)
      }
    })
  }, [searchParams, slug])

  // Carrega branding da empresa pelo slug
  useEffect(() => {
    if (!slug) { setNotFound(true); return }
    supabase
      .from('companies')
      .select('id, name, logo_url, favicon_url, primary_color')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); return }
        setCompany(data)
        // Aplica branding
        const color = data.primary_color || '#15A344'
        document.documentElement.style.setProperty('--brand', color)
        if (data.favicon_url) {
          let link = document.querySelector("link[rel~='icon']")
          if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link) }
          link.href = data.favicon_url
        }
        if (data.name) document.title = `${data.name} — Login`
      })
  }, [slug])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    // Verifica se o usuário pertence a essa empresa
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', data.user.id)
      .single()

    if (!profile || profile.company_id !== company.id) {
      await supabase.auth.signOut()
      setError('Usuário não pertence a esta empresa.')
      setLoading(false)
      return
    }

    // Salva slug para redirect caso a sessão expire
    localStorage.setItem('lastSlug', slug)
    const blingCode = sessionStorage.getItem('bling_oauth_code')
    if (blingCode) {
      sessionStorage.removeItem('bling_oauth_code')
      navigate(`/admin/${slug}/integrations?bling_code=${blingCode}`, { replace: true })
    } else {
      navigate(`/admin/${slug}/dashboard`)
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#f3f4f8] flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <p className="text-gray-500 text-sm">Empresa não encontrada.</p>
          <p className="text-gray-400 text-xs">Verifique o link de acesso.</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-[#f3f4f8] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    )
  }

  const brandColor = company.primary_color || '#15A344'

  return (
    <div className="min-h-screen bg-[#f3f4f8] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-14 w-auto object-contain" />
          ) : (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: brandColor }}
            >
              <span className="text-white font-bold text-lg">{company.name[0]}</span>
            </div>
          )}
          <p className="text-sm text-gray-400">Painel administrativo</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Entrar</h1>
            <p className="text-xs text-gray-400 mt-0.5">{company.name}</p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-xs text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-gray-600">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-gray-600">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-9 text-sm pr-9"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-9 gap-2 text-sm text-white"
              style={{ backgroundColor: brandColor }}
            >
              {loading
                ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <LogIn className="h-3.5 w-3.5" />
              }
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400">
          Desenvolvido por <span className="font-medium text-gray-500">Vend.ai</span>
        </p>
      </div>
    </div>
  )
}
