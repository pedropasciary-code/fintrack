import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

function getCicloAtual(diaReset: number): Date {
  const hoje = new Date()
  let ano = hoje.getFullYear()
  let mes = hoje.getMonth()
  if (hoje.getDate() < diaReset) {
    if (mes === 0) { mes = 11; ano-- } else mes--
  }
  return new Date(ano, mes, diaReset, 0, 0, 0, 0)
}

function isNoCiclo(dateStr: string, diaReset: number): boolean {
  return new Date(dateStr + 'T12:00:00') >= getCicloAtual(diaReset)
}

async function getPendentes(supabase: ReturnType<typeof createClient>) {
  const [{ data: fixos }, { data: config }, { data: lancamentos }] = await Promise.all([
    supabase.from('gastos_fixos').select('*').eq('ativo', true),
    supabase.from('configuracoes').select('dia_reset').eq('id', 1).single(),
    supabase.from('lancamentos').select('descricao, categoria, tipo, data'),
  ])

  const diaReset  = (config?.dia_reset ?? 1) as number
  const cicloItens = (lancamentos ?? []).filter(l => isNoCiclo(l.data, diaReset))

  const pendentes = (fixos ?? []).filter(f =>
    !cicloItens.some(l =>
      l.descricao === f.descricao &&
      l.categoria === f.categoria &&
      l.tipo      === f.tipo
    )
  )

  return { pendentes, diaReset }
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { pendentes } = await getPendentes(supabase)
  return NextResponse.json({ pendentes })
}

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { pendentes, diaReset } = await getPendentes(supabase)
  if (pendentes.length === 0) return NextResponse.json({ criados: 0 })

  const cicloInicio = getCicloAtual(diaReset)
  const year  = cicloInicio.getFullYear()
  const month = String(cicloInicio.getMonth() + 1).padStart(2, '0')

  const toInsert = pendentes.map(f => ({
    descricao: f.descricao,
    valor:     f.valor,
    categoria: f.categoria,
    tipo:      f.tipo,
    data:      `${year}-${month}-${String(Math.min(f.dia_vencimento, 28)).padStart(2, '0')}`,
  }))

  const { error } = await supabase.from('lancamentos').insert(toInsert)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ criados: toInsert.length })
}
