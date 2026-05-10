import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { isNoCiclo } from '@/lib/supabase'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const [
    { data: lancamentos },
    { data: fixosData },
    { data: parcelamentosData },
    { data: configData },
  ] = await Promise.all([
    supabase.from('lancamentos').select('valor, tipo, data'),
    supabase.from('gastos_fixos').select('valor, tipo').eq('ativo', true),
    supabase.from('parcelamentos').select('valor_parcela, parcelas_pagas, num_parcelas').eq('ativo', true),
    supabase.from('configuracoes').select('dia_reset').eq('id', 1).single(),
  ])

  const diaReset = configData?.dia_reset ?? 1
  const all      = (lancamentos ?? []) as { valor: number; tipo: string; data: string }[]

  const ciclo       = all.filter(l => isNoCiclo(l.data, diaReset))
  const ganhosCiclo = ciclo.filter(l => l.tipo === 'ganho').reduce((s, l) => s + l.valor, 0)
  const gastosCiclo = ciclo.filter(l => l.tipo === 'gasto').reduce((s, l) => s + l.valor, 0)

  const fixos           = (fixosData ?? []) as { valor: number; tipo: string }[]
  const ganhosFixos     = fixos.filter(f => f.tipo === 'ganho').reduce((s, f) => s + f.valor, 0)
  const gastosFixos     = fixos.filter(f => f.tipo === 'gasto').reduce((s, f) => s + f.valor, 0)

  const parcelamentosAtivos = ((parcelamentosData ?? []) as { valor_parcela: number; parcelas_pagas: number; num_parcelas: number }[])
    .filter(p => p.parcelas_pagas < p.num_parcelas)
  const gastosParcelamentos = parcelamentosAtivos.reduce((s, p) => s + p.valor_parcela, 0)

  const saldoProjetado  = ganhosCiclo - gastosCiclo + ganhosFixos - gastosFixos - gastosParcelamentos
  const saldoCumulativo = all.filter(l => l.tipo === 'ganho').reduce((s, l) => s + l.valor, 0)
                        - all.filter(l => l.tipo === 'gasto').reduce((s, l) => s + l.valor, 0)

  return NextResponse.json({ saldoProjetado, saldoCumulativo })
}
