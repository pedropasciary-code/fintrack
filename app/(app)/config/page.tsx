'use client'
import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'

export default function ConfigPage() {
  const [diaInput, setDiaInput]   = useState('')
  const [diaSalvo, setDiaSalvo]   = useState(1)
  const [fetching, setFetching]   = useState(true)
  const [loading, setLoading]     = useState(false)
  const [ok, setOk]               = useState(false)
  const [erro, setErro]           = useState('')

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(({ diaReset }) => {
        setDiaSalvo(diaReset)
        setDiaInput(String(diaReset))
        setFetching(false)
      })
  }, [])

  async function salvar() {
    setErro('')
    const dia = Number(diaInput)
    if (!dia || dia < 1 || dia > 28) {
      setErro('Informe um dia entre 1 e 28.')
      return
    }
    setLoading(true)
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diaReset: dia }),
    })
    setLoading(false)
    if (!res.ok) { setErro('Erro ao salvar.'); return }
    setDiaSalvo(dia)
    setOk(true)
    setTimeout(() => setOk(false), 2000)
  }

  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long' })
  const mesAnterior = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long' })

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Configurações</h1>

      <div className="card p-6 max-w-md mb-5">
        <h2 className="text-sm font-medium text-gray-700 mb-1">Dia de reset do ciclo mensal</h2>
        <p className="text-xs text-gray-400 mb-5">
          Define a partir de qual dia começa um novo período. Se seu salário cai todo dia 5,
          defina 5 — o ciclo vai do dia 5 ao dia 4 do mês seguinte.
        </p>

        <label className="label">Dia do mês (1–28)</label>
        <input
          className="field mb-4"
          type="number"
          min="1"
          max="28"
          placeholder="Ex: 5"
          value={diaInput}
          onChange={e => setDiaInput(e.target.value)}
        />

        {erro && <p className="text-sm text-red-500 mb-3">{erro}</p>}

        {ok ? (
          <div className="flex items-center gap-2 text-brand-400 text-sm font-medium py-2">
            <CheckCircle size={16} /> Configuração salva!
          </div>
        ) : (
          <button className="btn-primary w-full" onClick={salvar} disabled={loading || fetching}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        )}
      </div>

      {!fetching && (
        <div className="card p-6 max-w-md">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Ciclo atual</h2>
          <p className="text-sm text-gray-500">
            Com o reset no dia <strong className="text-gray-800">{diaSalvo}</strong>,
            o ciclo atual vai de{' '}
            <strong className="text-gray-800">
              {diaSalvo} de {new Date().getDate() >= diaSalvo ? mesAtual : mesAnterior}
            </strong>{' '}
            até o dia{' '}
            <strong className="text-gray-800">
              {diaSalvo - 1 === 0 ? 'último dia' : diaSalvo - 1} do mês seguinte
            </strong>.
          </p>
        </div>
      )}
    </div>
  )
}
