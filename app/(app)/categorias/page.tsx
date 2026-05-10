import { createClient } from '@/lib/supabase-server'
import {
  fmtBRL, isNoCiclo,
  CAT_COLORS, ALL_CATS, type Lancamento,
} from '@/lib/supabase'

export const revalidate = 0

export default async function CategoriasPage() {
  const supabase = createClient()
  const [{ data }, { data: configData }] = await Promise.all([
    supabase.from('lancamentos').select('*').order('data', { ascending: false }),
    supabase.from('configuracoes').select('dia_reset').eq('id', 1).single(),
  ])

  const diaReset    = (configData?.dia_reset ?? 1) as number
  const lancamentos = (data ?? []) as Lancamento[]
  const mesGastos   = lancamentos.filter(l => l.tipo === 'gasto' && isNoCiclo(l.data, diaReset))
  const totalMes    = mesGastos.reduce((s, l) => s + l.valor, 0)

  const bycat: Record<string, Lancamento[]> = {}
  mesGastos.forEach(l => {
    if (!bycat[l.categoria]) bycat[l.categoria] = []
    bycat[l.categoria].push(l)
  })

  const entries = Object.entries(bycat).sort(
    (a, b) =>
      b[1].reduce((s, l) => s + l.valor, 0) -
      a[1].reduce((s, l) => s + l.valor, 0)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Gastos por categoria</h1>
        <span className="text-sm text-gray-400">
          Total: <strong className="text-gray-700">{fmtBRL(totalMes)}</strong> este ciclo
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-400">
          Nenhum gasto registrado neste ciclo.
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map(([cat, items]) => {
            const catInfo = ALL_CATS.find(c => c.value === cat)
            const total   = items.reduce((s, l) => s + l.valor, 0)
            const pct     = totalMes > 0 ? Math.round((total / totalMes) * 100) : 0
            const color   = CAT_COLORS[cat] ?? '#B4B2A9'

            return (
              <div key={cat} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{ background: color + '22' }}
                  >
                    {catInfo?.emoji ?? '📦'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-800">
                        {catInfo?.label ?? cat}
                      </span>
                      <span className="text-sm font-semibold" style={{ color }}>
                        {fmtBRL(total)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                </div>

                <ul className="divide-y divide-gray-50 mt-2">
                  {items.slice(0, 5).map(l => (
                    <li key={l.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm text-gray-700">{l.descricao}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(l.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-red-500">−{fmtBRL(l.valor)}</p>
                    </li>
                  ))}
                  {items.length > 5 && (
                    <li className="pt-2 text-xs text-gray-400">
                      +{items.length - 5} lançamento(s) não exibido(s)
                    </li>
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
