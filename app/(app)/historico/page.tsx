'use client'
import { useState, useEffect, useMemo } from 'react'
import { ALL_CATS, CAT_COLORS, CATS_GASTO, CATS_GANHO, fmtBRL, type Lancamento } from '@/lib/supabase'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import Spinner from '@/components/Spinner'
import ConfirmModal from '@/components/ConfirmModal'

export default function HistoricoPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [fetching, setFetching]       = useState(true)
  const [error, setError]             = useState('')
  const [filtroTipo, setFiltroTipo]   = useState<'todos' | 'gasto' | 'ganho'>('todos')
  const [filtroCat, setFiltroCat]     = useState('todas')
  const [busca, setBusca]             = useState('')
  const [editingId, setEditingId]     = useState<number | null>(null)
  const [confirmId, setConfirmId]     = useState<number | null>(null)
  const [editForm, setEditForm]       = useState({
    descricao: '', valor: '', categoria: 'alimentacao',
    tipo: 'gasto' as 'gasto' | 'ganho', data: '',
  })

  async function load() {
    setError('')
    try {
      const data = await fetch('/api/lancamentos').then(r => r.json())
      setLancamentos(Array.isArray(data) ? data : [])
    } catch {
      setError('Erro ao carregar lançamentos. Tente recarregar a página.')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => { load() }, [])

  function startEdit(l: Lancamento) {
    setEditingId(l.id)
    setEditForm({ descricao: l.descricao, valor: String(l.valor), categoria: l.categoria, tipo: l.tipo, data: l.data })
  }

  async function saveEdit(id: number) {
    await fetch('/api/lancamentos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editForm, valor: Number(editForm.valor) }),
    })
    setEditingId(null)
    load()
  }

  async function confirmDelete() {
    if (confirmId === null) return
    await fetch('/api/lancamentos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: confirmId }),
    })
    setConfirmId(null)
    load()
  }

  const cats = filtroTipo === 'gasto' ? CATS_GASTO : filtroTipo === 'ganho' ? CATS_GANHO : ALL_CATS

  const filtered = useMemo(() => lancamentos.filter(l => {
    if (filtroTipo !== 'todos' && l.tipo !== filtroTipo) return false
    if (filtroCat !== 'todas' && l.categoria !== filtroCat) return false
    if (busca && !l.descricao.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  }), [lancamentos, filtroTipo, filtroCat, busca])

  const editCats = editForm.tipo === 'gasto' ? CATS_GASTO : CATS_GANHO

  return (
    <div>
      <ConfirmModal
        open={confirmId !== null}
        message="O lançamento será removido permanentemente."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmId(null)}
      />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Histórico</h1>
        <span className="text-sm text-gray-400">{filtered.length} lançamento(s)</span>
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <input
          className="field flex-1 min-w-[160px]"
          placeholder="Buscar descrição..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <select
          className="field w-36"
          value={filtroTipo}
          onChange={e => { setFiltroTipo(e.target.value as 'todos' | 'gasto' | 'ganho'); setFiltroCat('todas') }}
        >
          <option value="todos">Todos</option>
          <option value="gasto">Gastos</option>
          <option value="ganho">Ganhos</option>
        </select>
        <select className="field w-44" value={filtroCat} onChange={e => setFiltroCat(e.target.value)}>
          <option value="todas">Todas as cats.</option>
          {cats.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
        </select>
      </div>

      {/* Lista */}
      {fetching ? (
        <div className="card p-10 flex justify-center">
          <Spinner size={24} />
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-red-500 mb-3">{error}</p>
          <button onClick={load} className="text-sm text-brand-400 hover:underline">Tentar novamente</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-400">Nenhum lançamento encontrado.</div>
      ) : (
        <div className="card">
          <ul>
            {filtered.map(l => {
              const cat       = ALL_CATS.find(c => c.value === l.categoria)
              const isEditing = editingId === l.id

              return (
                <li key={l.id} className="border-b border-gray-50 last:border-0">
                  {isEditing ? (
                    <div className="px-5 py-4 space-y-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditForm(f => ({ ...f, tipo: 'gasto', categoria: 'alimentacao' }))}
                          className={editForm.tipo === 'gasto' ? 'btn-primary text-xs py-1 px-3' : 'btn-secondary text-xs py-1 px-3'}
                        >Gasto</button>
                        <button
                          onClick={() => setEditForm(f => ({ ...f, tipo: 'ganho', categoria: 'salario' }))}
                          className={editForm.tipo === 'ganho' ? 'btn-primary text-xs py-1 px-3' : 'btn-secondary text-xs py-1 px-3'}
                        >Ganho</button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input className="field" placeholder="Descrição" value={editForm.descricao} onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} />
                        <input className="field" type="number" placeholder="Valor" value={editForm.valor} onChange={e => setEditForm(f => ({ ...f, valor: e.target.value }))} />
                        <select className="field" value={editForm.categoria} onChange={e => setEditForm(f => ({ ...f, categoria: e.target.value }))}>
                          {editCats.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                        </select>
                        <input className="field" type="date" value={editForm.data} onChange={e => setEditForm(f => ({ ...f, data: e.target.value }))} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(l.id)} className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1">
                          <Check size={13} /> Salvar
                        </button>
                        <button onClick={() => setEditingId(null)} className="btn-secondary text-xs py-1.5 px-4 flex items-center gap-1">
                          <X size={13} /> Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-5 py-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                        style={{ background: (CAT_COLORS[l.categoria] ?? '#B4B2A9') + '22' }}
                      >
                        {cat?.emoji ?? '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{l.descricao}</p>
                        <p className="text-xs text-gray-400">
                          {cat?.label ?? l.categoria} · {new Date(l.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <p className={`text-sm font-medium shrink-0 ${l.tipo === 'gasto' ? 'text-red-500' : 'text-brand-400'}`}>
                        {l.tipo === 'gasto' ? '−' : '+'}{fmtBRL(l.valor)}
                      </p>
                      <button onClick={() => startEdit(l)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setConfirmId(l.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
