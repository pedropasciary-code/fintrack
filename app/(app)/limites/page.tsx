'use client'
import { useState, useEffect } from 'react'
import { fmtBRL } from '@/lib/supabase'
import { CheckCircle } from 'lucide-react'

export default function LimitesPage() {
  const [limiteInput, setLimiteInput]   = useState('')
  const [limiteSalvo, setLimiteSalvo]   = useState(0)
  const [gastosSemanais, setGastosSemanais] = useState(0)
  const [loading, setLoading]   = useState(false)
  const [fetching, setFetching] = useState(true)
  const [ok, setOk]             = useState(false)

  useEffect(() => {
    fetch('/api/limite')
      .then(r => r.json())
      .then(({ limiteSemanal, gastosSemanais: g }) => {
        setLimiteSalvo(limiteSemanal)
        setLimiteInput(String(limiteSemanal))
        setGastosSemanais(g)
        setFetching(false)
      })
  }, [])

  async function salvar() {
    const v = Number(limiteInput)
    if (!v || v <= 0) return
    setLoading(true)
    await fetch('/api/limite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor: v }),
    })
    setLimiteSalvo(v)
    setLoading(false)
    setOk(true)
    setTimeout(() => setOk(false), 2000)
  }

  const pct      = limiteSalvo > 0 ? Math.min(100, Math.round((gastosSemanais / limiteSalvo) * 100)) : 0
  const resta    = Math.max(0, limiteSalvo - gastosSemanais)
  const barColor = pct >= 100 ? '#D85A30' : pct >= 80 ? '#BA7517' : '#1D9E75'

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Limite semanal</h1>

      {/* Config card */}
      <div className="card p-6 max-w-md mb-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Configurar limite</h2>
        <label className="label">Valor máximo por semana (R$)</label>
        <input
          className="field mb-4"
          type="number"
          min="0"
          step="10"
          placeholder="Ex: 500"
          value={limiteInput}
          onChange={e => setLimiteInput(e.target.value)}
        />
        {ok ? (
          <div className="flex items-center gap-2 text-brand-400 text-sm font-medium py-2">
            <CheckCircle size={16} /> Limite salvo!
          </div>
        ) : (
          <button className="btn-primary w-full" onClick={salvar} disabled={loading || fetching}>
            {loading ? 'Salvando...' : 'Salvar limite'}
          </button>
        )}
      </div>

      {/* Status card */}
      {!fetching && limiteSalvo > 0 && (
        <div className="card p-6 max-w-md">
          <h2 className="text-sm font-medium text-gray-700 mb-5">Status desta semana</h2>

          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Gasto</span>
            <span className="font-medium">{fmtBRL(gastosSemanais)}</span>
          </div>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-500">Limite</span>
            <span className="font-medium">{fmtBRL(limiteSalvo)}</span>
          </div>

          {/* Progress bar */}
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: barColor }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-400 mb-5">
            <span>{pct}% utilizado</span>
            <span>{100 - pct}% livre</span>
          </div>

          {/* Remaining */}
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: barColor + '18' }}
          >
            <p className="text-xs mb-1" style={{ color: barColor }}>Você ainda pode gastar</p>
            <p className="text-2xl font-semibold" style={{ color: barColor }}>
              {fmtBRL(resta)}
            </p>
            <p className="text-xs mt-1" style={{ color: barColor }}>esta semana</p>
          </div>
        </div>
      )}
    </div>
  )
}
