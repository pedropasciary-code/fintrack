import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('*')
    .order('data', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { descricao, valor, categoria, tipo, data } = body

  if (!descricao || !valor || !categoria || !tipo || !data)
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })

  const { data: inserted, error } = await supabase
    .from('lancamentos')
    .insert([{ descricao, valor: Number(valor), categoria, tipo, data }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(inserted, { status: 201 })
}
