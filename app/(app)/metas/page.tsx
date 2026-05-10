'use client'
import { useState, useEffect } from 'react'
import { fmtBRL, type Meta } from '@/lib/supabase'
import { CheckCircle, Trash2, Trophy } from 'lucide-react'

export default function MetasPage() {
  const [metas, setMetas]               = useState<Meta[]>([])
  const [saldoCumulativo, setSaldo]     = useState(0)
  const [fetching, setFetching]         = useState(true)
  const [form, setForm] = useState({ descricao: '', valor_alvo: '', prazo: '' })
  const [loading, setLoading]           = useState(false)
  const [ok, setOk]                     = useState(false)
  const [erro, setErro]                 = useState('')

  async function load() {
    try {
      const [metasData, saldoData] = await Promise.all([
        fetch('/api/metas').then(r => r.json()),
        fetch('/api/saldo').then(r => r.json()),
      ])
      setMetas(Array.isArray(metasData) ? metasData : [])
      setSaldo(saldoData.saldoCumulativo ?? 0)
    } catch { } finally { setFetching(false) }
  }

  useEffect(() => { load() }, [])

  async function adicionar() {
    setErro('')
    const val = Number(form.valor_alvo)
    if (!form.descricao.trim() || !val || val <= 0) { setErro('Preencha descrição e valor.'); return }
    setLoading(true)
    const res = await fetch('/api/metas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descricao: form.descricao.trim(), valor_alvo: val, prazo: form.prazo || null, ativo: true }),
    })
    setLoading(false)
    if (!res.ok) { const { error } = await res.json(); setErro(error ?? 'Erro ao salvar.'); return }
    setOk(true)
    setForm({ descricao: '', valor_alvo: '', prazo: '' })
    setTimeout(() => setOk(false), 2000)
    await load()
  }

  async function remover(id: number) {
    await fetch('/api/metas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Metas de economia</h1>
        {!fetching && (
          <span className="text-sm text-gray-400">
            Acumulado: <strong className={saldoCumulativo >= 0 ? 'text-brand-400' : 'text-red-500'}>{fmtBRL(saldoCumulativo)}</strong>
          </span>
        )}
      </div>

      {/* Formulário */}
      <div className="card p-6 max-w-xl mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Adicionar meta</h2>

        <div className="mb-4">
          <label className="label">Descrição</label>
          <input className="field" placeholder="Ex: Viagem, Reserva de emergência, Notebook..." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="label">Valor alvo (R$)</label>
            <input className="field" type="number" min="0" step="0.01" placeholder="0,00" value={form.valor_alvo} onChange={e => setForm(f => ({ ...f, valor_alvo: e.target.value }))} />
          </div>
          <div>
            <label className="label">Prazo (opcional)</label>
            <input className="field" type="date" value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} />
          </div>
        </div>

        {erro && <p className="text-sm text-red-500 mb-3">{erro}</p>}

        {ok ? (
          <div className="flex items-center gap-2 text-brand-400 text-sm font-medium py-2.5">
            <CheckCircle size={16} /> Meta adicionada!
          </div>
        ) : (
          <button className="btn-primary w-full" onClick={adicionar} disabled={loading}>
            {loading ? 'Salvando...' : 'Adicionar meta'}
          </button>
        )}
      </div>

      {/* Lista */}
      {!fetching && metas.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-400">Nenhuma meta cadastrada ainda.</div>
      ) : (
        <div className="space-y-4">
          {metas.map(meta => {
            const pct     = meta.valor_alvo > 0 ? Math.min(100, Math.round((saldoCumulativo / meta.valor_alvo) * 100)) : 0
            const atingida = saldoCumulativo >= meta.valor_alvo
            const barColor = atingida ? '#1D9E75' : pct >= 70 ? '#BA7517' : '#378ADD'
            const faltam  = Math.max(0, meta.valor_alvo - saldoCumulativo)
            return (
              <div key={meta.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      {atingida && <Trophy size={14} className="text-brand-400" />}
                      <p className="text-sm font-medium text-gray-800">{meta.descricao}</p>
                    </div>
                    {meta.prazo && (
                      <p className="text-xs text-gray-400">
                        Prazo: {new Date(meta.prazo + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <button onClick={() => remover(meta.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
                </div>

                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>{fmtBRL(Math.max(0, saldoCumulativo))} acumulados</span>
                  <span>meta: {fmtBRL(meta.valor_alvo)}</span>
                </div>

                {atingida ? (
                  <p className="text-xs font-medium" style={{ color: barColor }}>Meta atingida! 🎉</p>
                ) : (
                  <p className="text-xs text-gray-400">Faltam {fmtBRL(faltam)} · {pct}% concluído</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
