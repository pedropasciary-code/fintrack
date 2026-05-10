import { createClient } from '@/lib/supabase-server'
import {
  fmtBRL, isThisWeek, isNoCiclo, getCicloAtual,
  CAT_COLORS, ALL_CATS,
  type Lancamento, type GastoFixo, type Parcelamento, type Meta,
} from '@/lib/supabase'
import AlertaBanner from '@/components/AlertaBanner'
import BannerFixosPendentes from '@/components/BannerFixosPendentes'
import DashboardCharts from '@/components/DashboardCharts'
import { TrendingUp, TrendingDown, Wallet, Target, ArrowUpCircle, ArrowDownCircle, CreditCard, TrendingUp as Projection } from 'lucide-react'

export const revalidate = 0

async function getData() {
  const supabase = createClient()
  const [
    { data: lancamentos },
    { data: limiteRows },
    { data: fixosData },
    { data: parcelamentosData },
    { data: metasData },
    { data: configData },
  ] = await Promise.all([
    supabase.from('lancamentos').select('*').order('data', { ascending: false }),
    supabase.from('limite_semanal').select('*').order('updated_at', { ascending: false }).limit(1),
    supabase.from('gastos_fixos').select('*').eq('ativo', true).order('dia_vencimento', { ascending: true }),
    supabase.from('parcelamentos').select('*').eq('ativo', true),
    supabase.from('metas').select('*').eq('ativo', true),
    supabase.from('configuracoes').select('dia_reset').eq('id', 1).single(),
  ])
  return {
    lancamentos:    (lancamentos       ?? []) as Lancamento[],
    limiteSemanal:  (limiteRows?.[0]?.valor ?? 500) as number,
    fixosAtivos:    (fixosData         ?? []) as GastoFixo[],
    parcelamentos:  (parcelamentosData ?? []) as Parcelamento[],
    metas:          (metasData         ?? []) as Meta[],
    diaReset:       (configData?.dia_reset ?? 1) as number,
  }
}

export default async function DashboardPage() {
  const { lancamentos, limiteSemanal, fixosAtivos, parcelamentos, metas, diaReset } = await getData()

  // Ciclo atual
  const cicloItems = lancamentos.filter(l => isNoCiclo(l.data, diaReset))

  // Fixos ainda não lançados neste ciclo
  const fixosPendentes = fixosAtivos.filter(f =>
    !cicloItems.some(l =>
      l.descricao === f.descricao &&
      l.categoria === f.categoria &&
      l.tipo      === f.tipo
    )
  )
  const ganhosCiclo    = cicloItems.filter(l => l.tipo === 'ganho').reduce((s, l) => s + l.valor, 0)
  const gastosCiclo    = cicloItems.filter(l => l.tipo === 'gasto').reduce((s, l) => s + l.valor, 0)
  const gastosSemanais = lancamentos.filter(l => l.tipo === 'gasto' && isThisWeek(l.data)).reduce((s, l) => s + l.valor, 0)

  // Fixos
  const ganhosFixos = fixosAtivos.filter(f => f.tipo === 'ganho').reduce((s, f) => s + f.valor, 0)
  const gastosFixos = fixosAtivos.filter(f => f.tipo === 'gasto').reduce((s, f) => s + f.valor, 0)
  const netoFixos   = ganhosFixos - gastosFixos

  // Parcelamentos ativos com parcelas restantes
  const parcelamentosAtivos = parcelamentos.filter(p => p.parcelas_pagas < p.num_parcelas)
  const gastosParcelamentos = parcelamentosAtivos.reduce((s, p) => s + p.valor_parcela, 0)

  // Saldo projetado (ciclo + fixos + parcelamentos)
  const saldoProjetado = ganhosCiclo - gastosCiclo + netoFixos - gastosParcelamentos

  // Projeção do fim do ciclo
  const cicloInicio    = getCicloAtual(diaReset)
  const hoje           = new Date(); hoje.setHours(12, 0, 0, 0)
  const diasPassados   = Math.max(1, Math.round((hoje.getTime() - cicloInicio.getTime()) / 86400000))
  const fimCiclo       = new Date(cicloInicio)
  fimCiclo.getMonth() === 11
    ? (fimCiclo.setFullYear(fimCiclo.getFullYear() + 1), fimCiclo.setMonth(0))
    : fimCiclo.setMonth(fimCiclo.getMonth() + 1)
  const duracaoCiclo        = Math.round((fimCiclo.getTime() - cicloInicio.getTime()) / 86400000)
  const diasRestantes        = Math.max(0, duracaoCiclo - diasPassados)
  const mediaGastoDiario     = gastosCiclo / diasPassados
  const gastoProjetadoRest   = mediaGastoDiario * diasRestantes
  const saldoFimCiclo        = ganhosCiclo - gastosCiclo + netoFixos - gastosParcelamentos - gastoProjetadoRest

  // Saldo cumulativo (metas)
  const totalGanhosAll = lancamentos.filter(l => l.tipo === 'ganho').reduce((s, l) => s + l.valor, 0)
  const totalGastosAll = lancamentos.filter(l => l.tipo === 'gasto').reduce((s, l) => s + l.valor, 0)
  const saldoCumulativo = totalGanhosAll - totalGastosAll

  // Pie chart
  const catGastos: Record<string, number> = {}
  cicloItems.filter(l => l.tipo === 'gasto').forEach(l => {
    catGastos[l.categoria] = (catGastos[l.categoria] ?? 0) + l.valor
  })
  const catData = Object.entries(catGastos).sort((a, b) => b[1] - a[1]).map(([cat, val]) => ({
    name:  ALL_CATS.find(c => c.value === cat)?.label ?? cat,
    value: Math.round(val * 100) / 100,
    color: CAT_COLORS[cat] ?? '#B4B2A9',
  }))

  // Bar chart — últimos 6 ciclos financeiros
  const barData = Array.from({ length: 6 }, (_, i) => {
    const start = new Date(cicloInicio)
    start.setMonth(start.getMonth() - (5 - i))
    const end = new Date(start)
    end.setMonth(end.getMonth() + 1)

    let ganhos = 0, gastos = 0
    lancamentos.forEach(l => {
      const d = new Date(l.data + 'T12:00:00')
      if (d >= start && d < end) {
        if (l.tipo === 'ganho') ganhos += l.valor
        else gastos += l.valor
      }
    })
    return {
      name: start.toLocaleDateString('pt-BR', { month: 'short' }),
      Ganhos: Math.round(ganhos * 100) / 100,
      Gastos: Math.round(gastos * 100) / 100,
    }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-400">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <AlertaBanner gastosSemanais={gastosSemanais} limiteSemanal={limiteSemanal} />
      <BannerFixosPendentes pendentes={fixosPendentes} />

      {/* Row 1: métricas do ciclo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
        {[
          { label: 'Saldo projetado',   value: fmtBRL(saldoProjetado),  icon: Wallet,       color: saldoProjetado >= 0  ? 'text-brand-400' : 'text-red-500' },
          { label: 'Ganhos do ciclo',   value: fmtBRL(ganhosCiclo),     icon: TrendingUp,   color: 'text-brand-400' },
          { label: 'Gastos do ciclo',   value: fmtBRL(gastosCiclo),     icon: TrendingDown, color: 'text-red-500' },
          { label: 'Gasto esta semana', value: fmtBRL(gastosSemanais),  icon: Target,       color: gastosSemanais > limiteSemanal ? 'text-red-500' : 'text-amber-500' },
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

      {/* Row 2: fixos + parcelamentos + projeção */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Ganhos fixos/mês</p>
            <ArrowUpCircle size={14} className="text-brand-400" />
          </div>
          <p className="text-lg font-semibold text-brand-400">+{fmtBRL(ganhosFixos)}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Gastos fixos/mês</p>
            <ArrowDownCircle size={14} className="text-red-500" />
          </div>
          <p className="text-lg font-semibold text-red-500">−{fmtBRL(gastosFixos)}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Parcelamentos/mês</p>
            <CreditCard size={14} className="text-amber-500" />
          </div>
          <p className="text-lg font-semibold text-amber-500">−{fmtBRL(gastosParcelamentos)}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Fim do ciclo (prev.)</p>
            <Projection size={14} className={saldoFimCiclo >= 0 ? 'text-brand-400' : 'text-red-500'} />
          </div>
          <p className={`text-lg font-semibold ${saldoFimCiclo >= 0 ? 'text-brand-400' : 'text-red-500'}`}>
            {fmtBRL(saldoFimCiclo)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{diasRestantes} dias restantes</p>
        </div>
      </div>

      {/* Compromissos mensais (chips) */}
      {(fixosAtivos.length > 0 || parcelamentosAtivos.length > 0) && (
        <div className="card p-4 mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Compromissos mensais</p>
          <div className="flex flex-wrap gap-2">
            {fixosAtivos.map(f => {
              const cat = ALL_CATS.find(c => c.value === f.categoria)
              return (
                <div key={`f-${f.id}`} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5 text-xs">
                  <span>{cat?.emoji ?? '📦'}</span>
                  <span className="text-gray-600">{f.descricao}</span>
                  <span className={`font-medium ${f.tipo === 'ganho' ? 'text-brand-400' : 'text-red-500'}`}>
                    {f.tipo === 'ganho' ? '+' : '−'}{fmtBRL(f.valor)}
                  </span>
                </div>
              )
            })}
            {parcelamentosAtivos.map(p => {
              const cat = ALL_CATS.find(c => c.value === p.categoria)
              return (
                <div key={`p-${p.id}`} className="flex items-center gap-1.5 bg-amber-50 rounded-lg px-3 py-1.5 text-xs">
                  <span>{cat?.emoji ?? '📦'}</span>
                  <span className="text-gray-600">{p.descricao}</span>
                  <span className="text-gray-400">{p.parcelas_pagas + 1}/{p.num_parcelas}</span>
                  <span className="font-medium text-amber-600">−{fmtBRL(p.valor_parcela)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Metas */}
      {metas.length > 0 && (
        <div className="card p-4 mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Metas de economia</p>
          <div className="space-y-3">
            {metas.map(meta => {
              const pct      = meta.valor_alvo > 0 ? Math.min(100, Math.round((saldoCumulativo / meta.valor_alvo) * 100)) : 0
              const atingida = saldoCumulativo >= meta.valor_alvo
              const barColor = atingida ? '#1D9E75' : pct >= 70 ? '#BA7517' : '#378ADD'
              return (
                <div key={meta.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{meta.descricao}</span>
                    <span className="text-gray-400 text-xs">{pct}% · {fmtBRL(meta.valor_alvo)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <DashboardCharts catData={catData} barData={barData} />

      {/* Recentes */}
      <div className="card mt-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700">Lançamentos recentes</h2>
          <span className="text-xs text-gray-400">{lancamentos.length} no total</span>
        </div>
        {lancamentos.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">
            Nenhum lançamento ainda. Vá em &ldquo;Lançar&rdquo; para começar.
          </p>
        ) : (
          <ul>
            {lancamentos.slice(0, 8).map(l => {
              const cat = ALL_CATS.find(c => c.value === l.categoria)
              return (
                <li key={l.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: (CAT_COLORS[l.categoria] ?? '#B4B2A9') + '22' }}>
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
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
