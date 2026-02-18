import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null) // { type: 'success'|'error', message }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAlert(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setAlert({ type: 'error', message: 'E-mail ou senha inválidos. Tente novamente.' })
      setLoading(false)
      return
    }

    setAlert({ type: 'success', message: 'Login realizado com sucesso! Redirecionando...' })
    setTimeout(() => navigate('/admin/dashboard'), 1000)
  }

  return (
    <div className="min-h-screen bg-[#f3f4f8] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img
            src="https://hnkhihzeqtzqzybkjype.supabase.co/storage/v1/object/public/Logos-site/geezer_preto.png"
            alt="Geezer"
            className="h-16 w-auto object-contain"
          />
          <p className="text-sm text-gray-500">Gestão inteligente do seu negócio</p>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Entrar</CardTitle>
            <CardDescription>Acesse o painel administrativo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {alert && (
                <Alert variant={alert.type === 'error' ? 'destructive' : 'success'}>
                  {alert.type === 'error'
                    ? <AlertCircle className="h-4 w-4" />
                    : <CheckCircle2 className="h-4 w-4" />
                  }
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <div className="w-4 h-4 border-2 border-[#1a1a1a]/30 border-t-[#1a1a1a] rounded-full animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400">
          Desenvolvido por <span className="font-medium">vend.ai</span> &amp; Grupo Venda — © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
