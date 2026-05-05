import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'
import { fmtBRL } from '@/lib/supabase'

export default function AlertaBanner({
  gastosSemanais,
  limiteSemanal,
}: {
  gastosSemanais: number
  limiteSemanal: number
}) {
  if (limiteSemanal <= 0) return null
  const pct = gastosSemanais / limiteSemanal
  const resta = limiteSemanal - gastosSemanais

  if (pct >= 1)
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 mb-5 text-sm">
        <AlertTriangle size={16} className="shrink-0" />
        <span className="flex-1">
          <strong>Limite semanal atingido!</strong> Você gastou {fmtBRL(gastosSemanais)} de{' '}
          {fmtBRL(limiteSemanal)}.
        </span>
      </div>
    )

  if (pct >= 0.8)
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 mb-5 text-sm">
        <AlertCircle size={16} className="shrink-0" />
        <span className="flex-1">
          <strong>Atenção:</strong> {Math.round(pct * 100)}% do limite usado. Restam{' '}
          <strong>{fmtBRL(resta)}</strong>.
        </span>
        <span className="font-medium shrink-0">{Math.round((1 - pct) * 100)}% livre</span>
      </div>
    )

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-50 border border-brand-100 text-brand-600 mb-5 text-sm">
      <CheckCircle size={16} className="shrink-0" />
      <span className="flex-1">
        Semana OK — {fmtBRL(gastosSemanais)} de {fmtBRL(limiteSemanal)} gastos. Restam{' '}
        <strong>{fmtBRL(resta)}</strong>.
      </span>
      <span className="font-medium shrink-0">{Math.round((1 - pct) * 100)}% livre</span>
    </div>
  )
}
