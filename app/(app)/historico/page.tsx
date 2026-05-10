'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { ALL_CATS, CAT_COLORS, CATS_GASTO, CATS_GANHO, fmtBRL, type Lancamento } from '@/lib/supabase'
import { Pencil, Trash2, Check, X, CalendarRange } from 'lucide-react'
import Spinner from '@/components/Spinner'
import ConfirmModal from '@/components/ConfirmModal'

const PAGE_SIZE = 30

function fmt(d: Date) { return d.toISOString().split('T')[0] }

const PRESETS = [
  {
    label: '7 dias',
    range: () => {
      const to = new Date(); const from = new Date(); from.setDate(from.getDate() - 6)
      return { from: fmt(from), to: fmt(to) }
    },
  },
  {
    label: 'Este mês',
    range: () => {
      const now = new Date()
      return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmt(now) }
    },
  },
  {
    label: 'Mês passado',
    range: () => {
      const now = new Date()
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const last  = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: fmt(first), to: fmt(last) }
    },
  },
  {
    label: '3 meses',
    range: () => {
      const to = new Date(); const from = new Date(); from.setMonth(from.getMonth() - 3)
      return { from: fmt(from), to: fmt(to) }
    },
  },
  {
    label: 'Este ano',
    range: () => {
      const now = new Date()
      return { from: fmt(new Date(now.getFullYear(), 0, 1)), to: fmt(now) }
    },
  },
]

export default function HistoricoPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [total, setTotal]             = useState(0)
  const [offset, setOffset]           = useState(0)
  const [fetching, setFetching]       = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError]             = useState('')
  const [filtroTipo, setFiltroTipo]   = useState<'todos' | 'gasto' | 'ganho'>('todos')
  const [filtroCat, setFiltroCat]     = useState('todas')
  const [busca, setBusca]             = useState('')
  const [debouncedBusca, setDebouncedBusca] = useState('')
  const [dataInicio, setDataInicio]   = useState('')
  const [dataFim, setDataFim]         = useState('')
  const [editingId, setEditingId]     = useState<number | null>(null)
  const [confirmId, setConfirmId]     = useState<number | null>(null)
  const [editForm, setEditForm]       = useState({
    descricao: '', valor: '', categoria: 'alimentacao',
    tipo: 'gasto' as 'gasto' | 'ganho', data: '',
  })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedBusca(busca), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [busca])

  const buildUrl = useCallback((theOffset: number, tipo: string, cat: string, q: string, di: string, df: string) => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(theOffset) })
    if (tipo !== 'todos') params.set('tipo', tipo)
    if (cat !== 'todas')  params.set('categoria', cat)
    if (q)                params.set('busca', q)
    if (di)               params.set('dataInicio', di)
    if (df)               params.set('dataFim', df)
    return `/api/lancamentos?${params}`
  }, [])

  const fetchPage = useCallback(async (theOffset: number, tipo: string, cat: string, q: string, di: string, df: string) => {
    const res = await fetch(buildUrl(theOffset, tipo, cat, q, di, df))
    if (!res.ok) throw new Error('Erro ao buscar lançamentos')
    return res.json() as Promise<{ data: Lancamento[]; total: number }>
  }, [buildUrl])

  useEffect(() => {
    let cancelled = false
    setFetching(true)
    setError('')
    setOffset(0)
    fetchPage(0, filtroTipo, filtroCat, debouncedBusca, dataInicio, dataFim)
      .then(({ data, total: t }) => {
        if (cancelled) return
        setLancamentos(data)
        setTotal(t)
      })
      .catch(() => { if (!cancelled) setError('Erro ao carregar lançamentos. Tente recarregar a página.') })
      .finally(() => { if (!cancelled) setFetching(false) })
    return () => { cancelled = true }
  }, [filtroTipo, filtroCat, debouncedBusca, dataInicio, dataFim, fetchPage])

  async function loadMore() {
    const nextOffset = offset + PAGE_SIZE
    setLoadingMore(true)
    try {
      const { data, total: t } = await fetchPage(nextOffset, filtroTipo, filtroCat, debouncedBusca, dataInicio, dataFim)
      setLancamentos(prev => [...prev, ...data])
      setTotal(t)
      setOffset(nextOffset)
    } catch {
      setError('Erro ao carregar mais lançamentos.')
    } finally {
      setLoadingMore(false)
    }
  }

  function applyPreset(preset: typeof PRESETS[0]) {
    const { from, to } = preset.range()
    setDataInicio(from)
    setDataFim(to)
  }

  function clearDates() { setDataInicio(''); setDataFim('') }

  function startEdit(l: Lancamento) {
    setEditingId(l.id)
    setEditForm({ descricao: l.descricao, valor: String(l.valor), categoria: l.categoria, tipo: l.tipo, data: l.data })
  }

  async function saveEdit(id: number) {
    const res = await fetch('/api/lancamentos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editForm, valor: Number(editForm.valor) }),
    })
    if (!res.ok) return
    setLancamentos(prev => prev.map(l => l.id === id
      ? { ...l, ...editForm, valor: Number(editForm.valor) }
      : l
    ))
    setEditingId(null)
  }

  async function confirmDelete() {
    if (confirmId === null) return
    const res = await fetch('/api/lancamentos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: confirmId }),
    })
    if (!res.ok) return
    setLancamentos(prev => prev.filter(l => l.id !== confirmId))
    setTotal(t => t - 1)
    setConfirmId(null)
  }

  const cats     = filtroTipo === 'gasto' ? CATS_GASTO : filtroTipo === 'ganho' ? CATS_GANHO : ALL_CATS
  const editCats = editForm.tipo === 'gasto' ? CATS_GASTO : CATS_GANHO
  const hasMore  = offset + PAGE_SIZE < total
  const hasDateFilter = dataInicio || dataFim

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
        {!fetching && (
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {lancamentos.length} de {total} lançamento(s)
          </span>
        )}
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-5 space-y-3">
        {/* Linha 1: busca + tipo + categoria */}
        <div className="flex flex-wrap gap-3 items-center">
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

        {/* Linha 2: período */}
        <div className="flex flex-wrap gap-2 items-center">
          <CalendarRange size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
          <input
            type="date"
            className="field w-36"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
          />
          <span className="text-xs text-gray-400 dark:text-gray-500">até</span>
          <input
            type="date"
            className="field w-36"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
          />
          {hasDateFilter && (
            <button onClick={clearDates} className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1">
              <X size={12} /> limpar
            </button>
          )}
          <div className="flex flex-wrap gap-1.5 ml-1">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="text-xs px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-brand-400 hover:text-brand-400 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista */}
      {fetching ? (
        <div className="card p-10 flex justify-center">
          <Spinner size={24} />
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-red-500 mb-3">{error}</p>
          <button
            onClick={() => { setError(''); setFetching(true); fetchPage(0, filtroTipo, filtroCat, debouncedBusca, dataInicio, dataFim).then(({ data, total: t }) => { setLancamentos(data); setTotal(t); setOffset(0) }).catch(() => setError('Erro ao carregar.')).finally(() => setFetching(false)) }}
            className="text-sm text-brand-400 hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : lancamentos.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-400 dark:text-gray-500">Nenhum lançamento encontrado.</div>
      ) : (
        <>
          <div className="card">
            <ul>
              {lancamentos.map(l => {
                const cat       = ALL_CATS.find(c => c.value === l.categoria)
                const isEditing = editingId === l.id

                return (
                  <li key={l.id} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
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
                          <p className="text-sm text-gray-800 dark:text-gray-100 truncate">{l.descricao}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {cat?.label ?? l.categoria} · {new Date(l.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <p className={`text-sm font-medium shrink-0 ${l.tipo === 'gasto' ? 'text-red-500' : 'text-brand-400'}`}>
                          {l.tipo === 'gasto' ? '−' : '+'}{fmtBRL(l.valor)}
                        </p>
                        <button onClick={() => startEdit(l)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setConfirmId(l.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          {hasMore && (
            <div className="flex justify-center mt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-secondary flex items-center gap-2 px-6"
              >
                {loadingMore ? <><Spinner size={14} /> Carregando...</> : `Carregar mais (${total - lancamentos.length} restante(s))`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
