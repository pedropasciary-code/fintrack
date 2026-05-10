'use client'
import { useState, useEffect } from 'react'
import { CATS_GASTO, CATS_GANHO, CAT_COLORS, ALL_CATS, fmtBRL, type GastoFixo } from '@/lib/supabase'
import { Trash2, CheckCircle, Power } from 'lucide-react'

export default function FixosPage() {
  const [fixos, setFixos]       = useState<GastoFixo[]>([])
  const [fetching, setFetching] = useState(true)
  const [tipo, setTipo]         = useState<'gasto' | 'ganho'>('gasto')
  const [form, setForm] = useState({
    descricao: '', valor: '', categoria: 'alimentacao', dia_vencimento: '5',
  })
  const [loading, setLoading] = useState(false)
  const [ok, setOk]   = useState(false)
  const [erro, setErro] = useState('')

  const cats = tipo === 'gasto' ? CATS_GASTO : CATS_GANHO

  function switchTipo(t: 'gasto' | 'ganho') {
    setTipo(t)
    setForm(f => ({ ...f, categoria: t === 'gasto' ? 'alimentacao' : 'salario' }))
  }

  async function load() {
    try {
      const res  = await fetch('/api/fixos')
      const data = await res.json()
      setFixos(Array.isArray(data) ? data : [])
    } catch {
      setFixos([])
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => { load() }, [])

  async function adicionar() {
    setErro('')
    const dia = Number(form.dia_vencimento)
    if (!form.descricao.trim() || !form.valor || Number(form.valor) <= 0) {
      setErro('Preencha descrição e valor corretamente.')
      return
    }
    if (!dia || dia < 1 || dia > 28) {
      setErro(`Dia de ${tipo === 'gasto' ? 'vencimento' : 'recebimento'} deve ser entre 1 e 28.`)
      return
    }
    setLoading(true)
    const res = await fetch('/api/fixos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descricao: form.descricao.trim(),
        valor: Number(form.valor),
        categoria: form.categoria,
        dia_vencimento: dia,
        ativo: true,
        tipo,
      }),
    })
    setLoading(false)
    if (!res.ok) {
      const { error } = await res.json()
      setErro(error ?? 'Erro ao salvar. Tente novamente.')
      return
    }
    setOk(true)
    setForm({ descricao: '', valor: '', categoria: tipo === 'gasto' ? 'alimentacao' : 'salario', dia_vencimento: '5' })
    setTimeout(() => setOk(false), 2000)
    await load()
  }

  async function toggleAtivo(fixo: GastoFixo) {
    await fetch('/api/fixos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: fixo.id, ativo: !fixo.ativo }),
    })
    load()
  }

  async function remover(id: number) {
    await fetch('/api/fixos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  const ativos     = fixos.filter(f => f.ativo)
  const gastoTotal = ativos.filter(f => f.tipo === 'gasto').reduce((s, f) => s + f.valor, 0)
  const ganhoTotal = ativos.filter(f => f.tipo === 'ganho').reduce((s, f) => s + f.valor, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Fixos mensais</h1>
        {!fetching && ativos.length > 0 && (
          <div className="flex gap-4 text-sm text-gray-400">
            {ganhoTotal > 0 && <span>Ganhos: <strong className="text-brand-400">+{fmtBRL(ganhoTotal)}</strong></span>}
            {gastoTotal > 0 && <span>Gastos: <strong className="text-red-500">−{fmtBRL(gastoTotal)}</strong></span>}
          </div>
        )}
      </div>

      {/* Formulário */}
      <div className="card p-6 max-w-xl mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Adicionar fixo</h2>

        {/* Tipo */}
        <div className="mb-4">
          <label className="label">Tipo</label>
          <div className="flex gap-2">
            <button onClick={() => switchTipo('gasto')}  className={tipo === 'gasto'  ? 'btn-primary' : 'btn-secondary'}>Gasto</button>
            <button onClick={() => switchTipo('ganho')}  className={tipo === 'ganho'  ? 'btn-primary' : 'btn-secondary'}>Ganho</button>
          </div>
        </div>

        <div className="mb-4">
          <label className="label">Descrição</label>
          <input
            className="field"
            placeholder={tipo === 'gasto' ? 'Ex: Aluguel, Netflix, Academia...' : 'Ex: Salário, Aluguel recebido...'}
            value={form.descricao}
            onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="label">Valor (R$)</label>
            <input
              className="field"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={form.valor}
              onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Categoria</label>
            <select
              className="field"
              value={form.categoria}
              onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
            >
              {cats.map(c => (
                <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{tipo === 'gasto' ? 'Dia vencimento' : 'Dia recebimento'}</label>
            <input
              className="field"
              type="number"
              min="1"
              max="28"
              placeholder="Ex: 5"
              value={form.dia_vencimento}
              onChange={e => setForm(f => ({ ...f, dia_vencimento: e.target.value }))}
            />
          </div>
        </div>

        {erro && <p className="text-sm text-red-500 mb-3">{erro}</p>}

        {ok ? (
          <div className="flex items-center gap-2 text-brand-400 text-sm font-medium py-2.5">
            <CheckCircle size={16} /> Fixo adicionado!
          </div>
        ) : (
          <button className="btn-primary w-full" onClick={adicionar} disabled={loading}>
            {loading ? 'Salvando...' : `Adicionar ${tipo === 'gasto' ? 'gasto' : 'ganho'} fixo`}
          </button>
        )}
      </div>

      {/* Lista */}
      {!fetching && fixos.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-400">
          Nenhum fixo cadastrado ainda.
        </div>
      ) : (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-700">Seus fixos mensais</h2>
          </div>
          <ul>
            {fixos.map(fixo => {
              const cat    = ALL_CATS.find(c => c.value === fixo.categoria)
              const isGanho = fixo.tipo === 'ganho'
              return (
                <li
                  key={fixo.id}
                  className={`flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0 transition-opacity ${!fixo.ativo ? 'opacity-40' : ''}`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ background: (CAT_COLORS[fixo.categoria] ?? '#B4B2A9') + '22' }}
                  >
                    {cat?.emoji ?? '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{fixo.descricao}</p>
                    <p className="text-xs text-gray-400">
                      {cat?.label ?? fixo.categoria} · todo dia {fixo.dia_vencimento}
                    </p>
                  </div>
                  <p className={`text-sm font-medium shrink-0 ${isGanho ? 'text-brand-400' : 'text-red-500'}`}>
                    {isGanho ? '+' : '−'}{fmtBRL(fixo.valor)}
                  </p>
                  <button
                    onClick={() => toggleAtivo(fixo)}
                    title={fixo.ativo ? 'Desativar' : 'Ativar'}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <Power size={14} />
                  </button>
                  <button
                    onClick={() => remover(fixo.id)}
                    title="Remover"
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
