import { NextResponse } from 'next/server'
import { supabase, isThisWeek, type Lancamento } from '@/lib/supabase'

export async function GET() {
  const [{ data: limiteRows }, { data: lancamentos }] = await Promise.all([
    supabase.from('limite_semanal').select('*').order('updated_at', { ascending: false }).limit(1),
    supabase.from('lancamentos').select('valor, tipo, data'),
  ])

  const limiteSemanal = limiteRows?.[0]?.valor ?? 500
  const gastosSemanais = ((lancamentos ?? []) as Lancamento[])
    .filter(l => l.tipo === 'gasto' && isThisWeek(l.data))
    .reduce((s, l) => s + l.valor, 0)

  return NextResponse.json({ limiteSemanal, gastosSemanais })
}

export async function POST(req: Request) {
  const { valor } = await req.json()
  if (!valor || valor <= 0)
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })

  // Upsert: usa row de id=1 sempre (uso pessoal, uma única config)
  const { error } = await supabase
    .from('limite_semanal')
    .upsert({ id: 1, valor, updated_at: new Date().toISOString() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
