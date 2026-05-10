'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmtBRL, type GastoFixo } from '@/lib/supabase'
import { CalendarClock, Check } from 'lucide-react'

export default function BannerFixosPendentes({ pendentes }: { pendentes: GastoFixo[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  if (done || pendentes.length === 0) return null

  async function lancarTodos() {
    setLoading(true)
    await fetch('/api/lancamentos/gerar-fixos', { method: 'POST' })
    setLoading(false)
    setDone(true)
    router.refresh()
  }

  const total = pendentes.reduce((s, f) => s + (f.tipo === 'ganho' ? f.valor : -f.valor), 0)

  return (
    <div className="card p-4 mb-4 flex items-center justify-between gap-4 border-l-4 border-amber-400">
      <div className="flex items-start gap-3 min-w-0">
        <CalendarClock size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800">
            {pendentes.length} fixo(s) ainda não lançado(s) neste ciclo
          </p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {pendentes.map(f => f.descricao).join(' · ')}
          </p>
        </div>
      </div>
      <button
        onClick={lancarTodos}
        disabled={loading}
        className="btn-primary text-xs py-1.5 px-4 shrink-0 flex items-center gap-1.5"
      >
        {loading ? 'Lançando...' : <><Check size={13} /> Lançar todos</>}
      </button>
    </div>
  )
}
