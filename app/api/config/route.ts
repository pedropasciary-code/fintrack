import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabase
    .from('configuracoes')
    .select('dia_reset')
    .eq('id', 1)
    .single()
  return NextResponse.json({ diaReset: data?.dia_reset ?? 1 })
}

export async function POST(req: Request) {
  const { diaReset } = await req.json()
  const dia = Number(diaReset)
  if (!dia || dia < 1 || dia > 28)
    return NextResponse.json({ error: 'Dia deve ser entre 1 e 28.' }, { status: 400 })
  await supabase.from('configuracoes').upsert({ id: 1, dia_reset: dia })
  return NextResponse.json({ ok: true })
}
