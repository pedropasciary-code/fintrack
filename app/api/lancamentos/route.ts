import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limitParam = searchParams.get('limit')
  const offset     = Math.max(0, Number(searchParams.get('offset') ?? 0))
  const limit      = Math.min(Math.max(1, Number(limitParam ?? 30)), 100)
  const tipo        = searchParams.get('tipo')       ?? ''
  const categoria   = searchParams.get('categoria')  ?? ''
  const busca       = searchParams.get('busca')      ?? ''
  const dataInicio  = searchParams.get('dataInicio') ?? ''
  const dataFim     = searchParams.get('dataFim')    ?? ''

  let query = supabase
    .from('lancamentos')
    .select('*', { count: 'exact' })
    .order('data',       { ascending: false })
    .order('id',         { ascending: false })
    .range(offset, offset + limit - 1)

  if (tipo      && tipo      !== 'todos') query = query.eq('tipo',       tipo)
  if (categoria && categoria !== 'todas') query = query.eq('categoria',  categoria)
  if (busca)                              query = query.ilike('descricao', `%${busca}%`)
  if (dataInicio)                         query = query.gte('data', dataInicio)
  if (dataFim)                            query = query.lte('data', dataFim)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [], total: count ?? 0 })
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

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

export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id, descricao, valor, categoria, tipo, data } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { error } = await supabase
    .from('lancamentos')
    .update({ descricao, valor: Number(valor), categoria, tipo, data })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { error } = await supabase.from('lancamentos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
