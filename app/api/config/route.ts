import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data } = await supabase
    .from('configuracoes')
    .select('dia_reset')
    .eq('id', 1)
    .single()

  return NextResponse.json({ diaReset: data?.dia_reset ?? 1 })
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { diaReset } = await req.json()
  const dia = Number(diaReset)
  if (!dia || dia < 1 || dia > 28)
    return NextResponse.json({ error: 'Dia deve ser entre 1 e 28.' }, { status: 400 })

  await supabase.from('configuracoes').upsert({ id: 1, dia_reset: dia })
  return NextResponse.json({ ok: true })
}
