import { AlertTriangle } from 'lucide-react'
import { useHealthCheck } from '@/hooks/useHealthCheck'

export default function HealthBanner() {
  const { isDown } = useHealthCheck()

  if (!isDown) return null

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2.5 z-50">
      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
      <p className="text-xs text-amber-800">
        <span className="font-semibold">Sistema temporariamente indisponível</span>
        {' '}— instabilidade no provedor de infraestrutura. Monitorando e avisaremos quando normalizar.
      </p>
    </div>
  )
}
