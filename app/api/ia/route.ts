import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase, isThisMonth, isThisWeek, ALL_CATS, type Lancamento } from '@/lib/supabase'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { message } = await req.json()

  // Fetch user's data to build context
  const [{ data: lancamentos }, { data: limiteRows }] = await Promise.all([
    supabase.from('lancamentos').select('*').order('data', { ascending: false }),
    supabase.from('limite_semanal').select('valor').limit(1),
  ])

  const all = (lancamentos ?? []) as Lancamento[]
  const mes = all.filter(l => isThisMonth(l.data))
  const limiteSemanal = limiteRows?.[0]?.valor ?? 500

  const totalGanhos    = mes.filter(l => l.tipo === 'ganho').reduce((s, l) => s + l.valor, 0)
  const totalGastos    = mes.filter(l => l.tipo === 'gasto').reduce((s, l) => s + l.valor, 0)
  const gastosSemanais = all.filter(l => l.tipo === 'gasto' && isThisWeek(l.data)).reduce((s, l) => s + l.valor, 0)

  const catGastos: Record<string, number> = {}
  mes.filter(l => l.tipo === 'gasto').forEach(l => {
    const label = ALL_CATS.find(c => c.value === l.categoria)?.label ?? l.categoria
    catGastos[label] = (catGastos[label] ?? 0) + l.valor
  })

  const systemPrompt = `Você é um assistente financeiro pessoal. Responda sempre em português, de forma concisa e prática, como um assessor financeiro direto.

Dados financeiros do usuário (${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}):
- Total de ganhos: R$ ${totalGanhos.toFixed(2)}
- Total de gastos: R$ ${totalGastos.toFixed(2)}
- Saldo do mês: R$ ${(totalGanhos - totalGastos).toFixed(2)}
- Gastos esta semana: R$ ${gastosSemanais.toFixed(2)} (limite: R$ ${limiteSemanal.toFixed(2)})
- Gastos por categoria: ${JSON.stringify(catGastos, null, 2)}
- Últimos 10 lançamentos: ${JSON.stringify(
    all.slice(0, 10).map(l => ({
      data: l.data,
      tipo: l.tipo,
      descricao: l.descricao,
      valor: l.valor,
      categoria: l.categoria,
    })),
    null, 2
  )}

Seja direto e objetivo. Dê sugestões práticas quando relevante.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    })

    const reply = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    return NextResponse.json({ reply })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ reply: 'Erro ao processar. Verifique a chave da API.' }, { status: 500 })
  }
}
