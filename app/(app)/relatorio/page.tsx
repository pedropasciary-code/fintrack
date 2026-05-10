import { supabase, fmtBRL, isNoCiclo, isNoCicloAnterior, ALL_CATS, type Lancamento } from '@/lib/supabase'

export const revalidate = 0

function pctChange(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0
  return Math.round(((curr - prev) / prev) * 100)
}

export default async function RelatorioPage() {
  const [{ data }, { data: configData }] = await Promise.all([
    supabase.from('lancamentos').select('*').order('data', { ascending: false }),
    supabase.from('configuracoes').select('dia_reset').eq('id', 1).single(),
  ])

  const diaReset    = (configData?.dia_reset ?? 1) as number
  const lancamentos = (data ?? []) as Lancamento[]

  const atual    = lancamentos.filter(l => isNoCiclo(l.data, diaReset))
  const anterior = lancamentos.filter(l => isNoCicloAnterior(l.data, diaReset))

  const ganhosAtual    = atual.filter(l => l.tipo === 'ganho').reduce((s, l) => s + l.valor, 0)
  const gastosAtual    = atual.filter(l => l.tipo === 'gasto').reduce((s, l) => s + l.valor, 0)
  const ganhosAnterior = anterior.filter(l => l.tipo === 'ganho').reduce((s, l) => s + l.valor, 0)
  const gastosAnterior = anterior.filter(l => l.tipo === 'gasto').reduce((s, l) => s + l.valor, 0)

  const catAtual: Record<string, number>    = {}
  const catAnterior: Record<string, number> = {}
  atual.filter(l => l.tipo === 'gasto').forEach(l => { catAtual[l.categoria] = (catAtual[l.categoria] ?? 0) + l.valor })
  anterior.filter(l => l.tipo === 'gasto').forEach(l => { catAnterior[l.categoria] = (catAnterior[l.categoria] ?? 0) + l.valor })

  const allCats = Array.from(new Set([...Object.keys(catAtual), ...Object.keys(catAnterior)]))
    .sort((a, b) => (catAtual[b] ?? 0) - (catAtual[a] ?? 0))

  const summaryRows = [
    { label: 'Ganhos',  atual: ganhosAtual,               anterior: ganhosAnterior,               goodWhenPositive: true  },
    { label: 'Gastos',  atual: gastosAtual,                anterior: gastosAnterior,                goodWhenPositive: false },
    { label: 'Saldo',   atual: ganhosAtual - gastosAtual,  anterior: ganhosAnterior - gastosAnterior, goodWhenPositive: true  },
  ]

  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">Relatório comparativo</h1>
      <p className="text-sm text-gray-400 mb-6">Ciclo atual vs ciclo anterior</p>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {summaryRows.map(({ label, atual: a, anterior: ant, goodWhenPositive }) => {
          const pct    = pctChange(a, ant)
          const isGood = goodWhenPositive ? pct >= 0 : pct <= 0
          return (
            <div key={label} className="card p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">{label}</p>
              <p className="text-lg font-semibold text-gray-800 mb-1">{fmtBRL(a)}</p>
              <p className="text-xs text-gray-400 mb-2">Anterior: {fmtBRL(ant)}</p>
              {ant !== 0 && (
                <span className={`text-xs font-medium ${isGood ? 'text-brand-400' : 'text-red-500'}`}>
                  {pct >= 0 ? '+' : ''}{pct}% vs anterior
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Por categoria */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700">Gastos por categoria</h2>
        </div>

        {allCats.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">
            Sem dados suficientes em dois ciclos para comparar.
          </p>
        ) : (
          <div>
            <div className="grid grid-cols-4 px-5 py-2 text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50">
              <span className="col-span-2">Categoria</span>
              <span className="text-right">Ciclo atual</span>
              <span className="text-right">Anterior</span>
            </div>
            {allCats.map(cat => {
              const catInfo = ALL_CATS.find(c => c.value === cat)
              const a       = catAtual[cat]    ?? 0
              const ant     = catAnterior[cat] ?? 0
              const pct     = pctChange(a, ant)
              return (
                <div key={cat} className="grid grid-cols-4 items-center px-5 py-3 border-b border-gray-50 last:border-0">
                  <div className="col-span-2 flex items-center gap-2">
                    <span>{catInfo?.emoji ?? '📦'}</span>
                    <span className="text-sm text-gray-700">{catInfo?.label ?? cat}</span>
                    {ant > 0 && a !== ant && (
                      <span className={`text-xs font-medium ${a < ant ? 'text-brand-400' : 'text-red-500'}`}>
                        {pct >= 0 ? '+' : ''}{pct}%
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-right font-medium text-gray-800">{a > 0 ? fmtBRL(a) : '—'}</span>
                  <span className="text-sm text-right text-gray-400">{ant > 0 ? fmtBRL(ant) : '—'}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
