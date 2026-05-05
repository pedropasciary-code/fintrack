import {
  supabase, fmtBRL, isThisMonth, isThisWeek,
  CAT_COLORS, ALL_CATS, type Lancamento,
} from '@/lib/supabase'
import AlertaBanner from '@/components/AlertaBanner'
import DashboardCharts from '@/components/DashboardCharts'
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react'

export const revalidate = 0

async function getData() {
  const [{ data: lancamentos }, { data: limiteRows }] = await Promise.all([
    supabase.from('lancamentos').select('*').order('data', { ascending: false }),
    supabase.from('limite_semanal').select('*').order('updated_at', { ascending: false }).limit(1),
  ])
  return {
    lancamentos:    (lancamentos ?? []) as Lancamento[],
    limiteSemanal:  (limiteRows?.[0]?.valor ?? 500) as number,
  }
}

export default async function DashboardPage() {
  const { lancamentos, limiteSemanal } = await getData()

  const mesItems      = lancamentos.filter(l => isThisMonth(l.data))
  const ganhos        = mesItems.filter(l => l.tipo === 'ganho').reduce((s, l) => s + l.valor, 0)
  const gastos        = mesItems.filter(l => l.tipo === 'gasto').reduce((s, l) => s + l.valor, 0)
  const saldo         = ganhos - gastos
  const gastosSemanais = lancamentos
    .filter(l => l.tipo === 'gasto' && isThisWeek(l.data))
    .reduce((s, l) => s + l.valor, 0)

  // Pie chart data
  const catGastos: Record<string, number> = {}
  mesItems.filter(l => l.tipo === 'gasto').forEach(l => {
    catGastos[l.categoria] = (catGastos[l.categoria] ?? 0) + l.valor
  })
  const catData = Object.entries(catGastos)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => ({
      name:  ALL_CATS.find(c => c.value === cat)?.label ?? cat,
      value: Math.round(val * 100) / 100,
      color: CAT_COLORS[cat] ?? '#B4B2A9',
    }))

  // Bar chart — last 6 months
  const now = new Date()
  const months: Record<string, { ganhos: number; gastos: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months[d.toLocaleDateString('pt-BR', { month: 'short' })] = { ganhos: 0, gastos: 0 }
  }
  lancamentos.forEach(l => {
    const key = new Date(l.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })
    if (key in months) {
      if (l.tipo === 'ganho') months[key].ganhos += l.valor
      else months[key].gastos += l.valor
    }
  })
  const barData = Object.entries(months).map(([name, v]) => ({
    name,
    Ganhos: Math.round(v.ganhos * 100) / 100,
    Gastos: Math.round(v.gastos * 100) / 100,
  }))

  const recentes = lancamentos.slice(0, 8)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-400">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long', day: 'numeric', month: 'long',
          })}
        </p>
      </div>

      <AlertaBanner gastosSemanais={gastosSemanais} limiteSemanal={limiteSemanal} />

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Saldo do mês',      value: fmtBRL(saldo),          icon: Wallet,       color: saldo >= 0 ? 'text-brand-400' : 'text-red-500' },
          { label: 'Total de ganhos',   value: fmtBRL(ganhos),         icon: TrendingUp,   color: 'text-brand-400' },
          { label: 'Total de gastos',   value: fmtBRL(gastos),         icon: TrendingDown, color: 'text-red-500' },
          { label: 'Gasto esta semana', value: fmtBRL(gastosSemanais), icon: Target,       color: gastosSemanais > limiteSemanal ? 'text-red-500' : 'text-amber-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
              <Icon size={14} className={color} />
            </div>
            <p className={`text-lg font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <DashboardCharts catData={catData} barData={barData} />

      {/* Recent transactions */}
      <div className="card mt-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700">Lançamentos recentes</h2>
          <span className="text-xs text-gray-400">{lancamentos.length} no total</span>
        </div>
        {recentes.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">
            Nenhum lançamento ainda. Vá em &ldquo;Lançar&rdquo; para começar.
          </p>
        ) : (
          <ul>
            {recentes.map(l => {
              const cat = ALL_CATS.find(c => c.value === l.categoria)
              return (
                <li key={l.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ background: (CAT_COLORS[l.categoria] ?? '#B4B2A9') + '22' }}
                  >
                    {cat?.emoji ?? '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{l.descricao}</p>
                    <p className="text-xs text-gray-400">
                      {cat?.label ?? l.categoria} ·{' '}
                      {new Date(l.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <p className={`text-sm font-medium shrink-0 ${l.tipo === 'gasto' ? 'text-red-500' : 'text-brand-400'}`}>
                    {l.tipo === 'gasto' ? '−' : '+'}{fmtBRL(l.valor)}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
