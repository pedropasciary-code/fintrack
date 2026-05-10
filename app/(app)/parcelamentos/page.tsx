'use client'
import { useState, useEffect } from 'react'
import { CATS_GASTO, CAT_COLORS, fmtBRL, type Parcelamento } from '@/lib/supabase'
import { Trash2, CheckCircle, Plus, Pencil, Check, X } from 'lucide-react'
import Spinner from '@/components/Spinner'
import ConfirmModal from '@/components/ConfirmModal'

function todayStr() { return new Date().toISOString().split('T')[0] }

export default function ParcelamentosPage() {
  const [parcelamentos, setParcelamentos] = useState<Parcelamento[]>([])
  const [fetching, setFetching]           = useState(true)
  const [error, setError]                 = useState('')
  const [confirmId, setConfirmId]         = useState<number | null>(null)
  const [editingId, setEditingId]         = useState<number | null>(null)
  const [editForm, setEditForm]           = useState({
    descricao: '', valor_parcela: '', categoria: 'outros', dia_vencimento: '',
  })
  const [form, setForm] = useState({
    descricao: '', valor_parcela: '', num_parcelas: '',
    categoria: 'outros', dia_vencimento: '5', data_inicio: todayStr(),
  })
  const [loading, setLoading] = useState(false)
  const [ok, setOk]   = useState(false)
  const [erro, setErro] = useState('')

  async function load() {
    setError('')
    try {
      const data = await fetch('/api/parcelamentos').then(r => r.json())
      setParcelamentos(Array.isArray(data) ? data : [])
    } catch {
      setError('Erro ao carregar parcelamentos. Tente recarregar a página.')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => { load() }, [])

  async function adicionar() {
    setErro('')
    const parcela = Number(form.valor_parcela)
    const total   = Number(form.num_parcelas)
    const dia     = Number(form.dia_vencimento)
    if (!form.descricao.trim() || !parcela || parcela <= 0) { setErro('Preencha descrição e valor da parcela.'); return }
    if (!total || total < 2) { setErro('Mínimo de 2 parcelas.'); return }
    if (!dia || dia < 1 || dia > 28) { setErro('Dia de vencimento entre 1 e 28.'); return }
    setLoading(true)
    const res = await fetch('/api/parcelamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descricao: form.descricao.trim(), valor_parcela: parcela,
        num_parcelas: total, parcelas_pagas: 0,
        categoria: form.categoria, dia_vencimento: dia,
        data_inicio: form.data_inicio, ativo: true,
      }),
    })
    setLoading(false)
    if (!res.ok) { const { error } = await res.json(); setErro(error ?? 'Erro ao salvar.'); return }
    setOk(true)
    setForm({ descricao: '', valor_parcela: '', num_parcelas: '', categoria: 'outros', dia_vencimento: '5', data_inicio: todayStr() })
    setTimeout(() => setOk(false), 2000)
    await load()
  }

  function startEdit(p: Parcelamento) {
    setEditingId(p.id)
    setEditForm({
      descricao: p.descricao,
      valor_parcela: String(p.valor_parcela),
      categoria: p.categoria,
      dia_vencimento: String(p.dia_vencimento),
    })
  }

  async function saveEdit(id: number) {
    const val = Number(editForm.valor_parcela)
    const dia = Number(editForm.dia_vencimento)
    if (!editForm.descricao.trim() || !val || val <= 0 || !dia || dia < 1 || dia > 28) return
    await fetch('/api/parcelamentos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, descricao: editForm.descricao.trim(), valor_parcela: val, categoria: editForm.categoria, dia_vencimento: dia }),
    })
    setEditingId(null)
    load()
  }

  async function pagarParcela(p: Parcelamento) {
    await fetch('/api/parcelamentos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, parcelas_pagas: p.parcelas_pagas + 1 }),
    })
    load()
  }

  async function confirmDelete() {
    if (confirmId === null) return
    await fetch('/api/parcelamentos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: confirmId }),
    })
    setConfirmId(null)
    load()
  }

  const ativos      = parcelamentos.filter(p => p.parcelas_pagas < p.num_parcelas)
  const concluidos  = parcelamentos.filter(p => p.parcelas_pagas >= p.num_parcelas)
  const totalMensal = ativos.reduce((s, p) => s + p.valor_parcela, 0)

  return (
    <div>
      <ConfirmModal
        open={confirmId !== null}
        message="O parcelamento será removido permanentemente."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmId(null)}
      />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Parcelamentos</h1>
        {!fetching && !error && ativos.length > 0 && (
          <span className="text-sm text-gray-400">
            Total/mês: <strong className="text-red-500">−{fmtBRL(totalMensal)}</strong>
          </span>
        )}
      </div>

      {/* Formulário */}
      <div className="card p-6 max-w-xl mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Adicionar parcelamento</h2>
        <div className="mb-4">
          <label className="label">Descrição</label>
          <input className="field" placeholder="Ex: Geladeira, iPhone, Curso..." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">Valor por parcela (R$)</label>
            <input className="field" type="number" min="0" step="0.01" placeholder="0,00" value={form.valor_parcela} onChange={e => setForm(f => ({ ...f, valor_parcela: e.target.value }))} />
          </div>
          <div>
            <label className="label">Nº de parcelas</label>
            <input className="field" type="number" min="2" max="360" placeholder="Ex: 12" value={form.num_parcelas} onChange={e => setForm(f => ({ ...f, num_parcelas: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-2">
          <div>
            <label className="label">Categoria</label>
            <select className="field" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
              {CATS_GASTO.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Dia vencimento</label>
            <input className="field" type="number" min="1" max="28" placeholder="Ex: 10" value={form.dia_vencimento} onChange={e => setForm(f => ({ ...f, dia_vencimento: e.target.value }))} />
          </div>
          <div>
            <label className="label">1ª parcela em</label>
            <input className="field" type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} />
          </div>
        </div>
        {form.valor_parcela && form.num_parcelas && Number(form.valor_parcela) > 0 && Number(form.num_parcelas) > 0 && (
          <p className="text-xs text-gray-400 mt-3 mb-4">
            Total: <strong>{fmtBRL(Number(form.valor_parcela) * Number(form.num_parcelas))}</strong>
            {' · '}quitado em <strong>{Number(form.num_parcelas)} meses</strong>
          </p>
        )}
        {erro && <p className="text-sm text-red-500 mb-3">{erro}</p>}
        {ok ? (
          <div className="flex items-center gap-2 text-brand-400 text-sm font-medium py-2.5">
            <CheckCircle size={16} /> Parcelamento adicionado!
          </div>
        ) : (
          <button className="btn-primary w-full" onClick={adicionar} disabled={loading}>
            {loading ? 'Salvando...' : 'Adicionar parcelamento'}
          </button>
        )}
      </div>

      {/* Lista */}
      {fetching ? (
        <div className="card p-10 flex justify-center"><Spinner size={24} /></div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-red-500 mb-3">{error}</p>
          <button onClick={load} className="text-sm text-brand-400 hover:underline">Tentar novamente</button>
        </div>
      ) : ativos.length === 0 && concluidos.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-400">Nenhum parcelamento cadastrado.</div>
      ) : (
        <>
          {ativos.length > 0 && (
            <div className="space-y-3 mb-4">
              {ativos.map(p => {
                const cat   = CATS_GASTO.find(c => c.value === p.categoria)
                const color = CAT_COLORS[p.categoria] ?? '#B4B2A9'
                const pct   = Math.round((p.parcelas_pagas / p.num_parcelas) * 100)
                const isEditing = editingId === p.id

                return (
                  <div key={p.id} className="card p-5">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          className="field"
                          placeholder="Descrição"
                          value={editForm.descricao}
                          onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))}
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="label">Valor/parcela (R$)</label>
                            <input className="field" type="number" min="0" step="0.01" value={editForm.valor_parcela} onChange={e => setEditForm(f => ({ ...f, valor_parcela: e.target.value }))} />
                          </div>
                          <div>
                            <label className="label">Categoria</label>
                            <select className="field" value={editForm.categoria} onChange={e => setEditForm(f => ({ ...f, categoria: e.target.value }))}>
                              {CATS_GASTO.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="label">Dia vencimento</label>
                            <input className="field" type="number" min="1" max="28" value={editForm.dia_vencimento} onChange={e => setEditForm(f => ({ ...f, dia_vencimento: e.target.value }))} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(p.id)} className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1">
                            <Check size={13} /> Salvar
                          </button>
                          <button onClick={() => setEditingId(null)} className="btn-secondary text-xs py-1.5 px-4 flex items-center gap-1">
                            <X size={13} /> Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: color + '22' }}>
                            {cat?.emoji ?? '📦'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-sm font-medium text-gray-800">{p.descricao}</p>
                              <p className="text-sm font-medium text-red-500">−{fmtBRL(p.valor_parcela)}/mês</p>
                            </div>
                            <p className="text-xs text-gray-400">
                              {cat?.label ?? p.categoria} · parcela {p.parcelas_pagas + 1}/{p.num_parcelas} · {p.num_parcelas - p.parcelas_pagas} restante(s)
                            </p>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => pagarParcela(p)} className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1 flex-1 justify-center">
                            <Plus size={12} /> Registrar parcela paga
                          </button>
                          <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setConfirmId(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {concluidos.length > 0 && (
            <div className="card">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-medium text-gray-400">Concluídos</h2>
              </div>
              <ul>
                {concluidos.map(p => {
                  const cat = CATS_GASTO.find(c => c.value === p.categoria)
                  return (
                    <li key={p.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0 opacity-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">{p.descricao}</p>
                        <p className="text-xs text-gray-400">{cat?.label} · {p.num_parcelas}× {fmtBRL(p.valor_parcela)} · quitado</p>
                      </div>
                      <button onClick={() => setConfirmId(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
