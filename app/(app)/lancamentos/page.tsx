'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATS_GASTO, CATS_GANHO } from '@/lib/supabase'
import { CheckCircle } from 'lucide-react'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function LancamentosPage() {
  const router = useRouter()
  const [tipo, setTipo] = useState<'gasto' | 'ganho'>('gasto')
  const [form, setForm] = useState({
    descricao: '', valor: '', categoria: 'alimentacao', data: todayStr(),
  })
  const [loading, setLoading] = useState(false)
  const [ok, setOk]   = useState(false)
  const [erro, setErro] = useState('')

  const cats = tipo === 'gasto' ? CATS_GASTO : CATS_GANHO

  function switchTipo(t: 'gasto' | 'ganho') {
    setTipo(t)
    setForm(f => ({ ...f, categoria: t === 'gasto' ? 'alimentacao' : 'salario' }))
  }

  async function submit() {
    setErro('')
    if (!form.descricao.trim() || !form.valor || Number(form.valor) <= 0) {
      setErro('Preencha descrição e valor corretamente.')
      return
    }
    setLoading(true)
    const res = await fetch('/api/lancamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tipo, valor: Number(form.valor) }),
    })
    setLoading(false)
    if (!res.ok) { setErro('Erro ao salvar. Tente novamente.'); return }
    setOk(true)
    setForm({ descricao: '', valor: '', categoria: tipo === 'gasto' ? 'alimentacao' : 'salario', data: todayStr() })
    setTimeout(() => { setOk(false); router.refresh() }, 2000)
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Lançar gasto ou ganho</h1>

      <div className="card p-6 max-w-xl">
        {/* Tipo */}
        <div className="mb-5">
          <label className="label">Tipo</label>
          <div className="flex gap-2">
            <button
              onClick={() => switchTipo('gasto')}
              className={tipo === 'gasto' ? 'btn-primary' : 'btn-secondary'}
            >
              Gasto
            </button>
            <button
              onClick={() => switchTipo('ganho')}
              className={tipo === 'ganho' ? 'btn-primary' : 'btn-secondary'}
            >
              Ganho
            </button>
          </div>
        </div>

        {/* Descrição */}
        <div className="mb-4">
          <label className="label">Descrição</label>
          <input
            className="field"
            placeholder={tipo === 'gasto' ? 'Ex: almoço, uber, mercado...' : 'Ex: salário de abril...'}
            value={form.descricao}
            onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
          />
        </div>

        {/* Valor + Categoria */}
        <div className="grid grid-cols-2 gap-4 mb-4">
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
        </div>

        {/* Data */}
        <div className="mb-6">
          <label className="label">Data</label>
          <input
            className="field"
            type="date"
            value={form.data}
            onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
          />
        </div>

        {erro && <p className="text-sm text-red-500 mb-3">{erro}</p>}

        {ok ? (
          <div className="flex items-center justify-center gap-2 text-brand-400 text-sm font-medium py-2.5">
            <CheckCircle size={16} /> Lançamento registrado!
          </div>
        ) : (
          <button className="btn-primary w-full" onClick={submit} disabled={loading}>
            {loading ? 'Salvando...' : 'Registrar lançamento'}
          </button>
        )}
      </div>
    </div>
  )
}
