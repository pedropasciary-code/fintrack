'use client'
import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send } from 'lucide-react'

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGESTOES = [
  'Analise meus gastos do mês',
  'Onde posso economizar?',
  'Como estou em relação ao limite semanal?',
  'Resuma minha situação financeira',
  'Qual categoria gasto mais?',
]

export default function IAPage() {
  const [msgs, setMsgs]       = useState<Msg[]>([
    { role: 'assistant', content: 'Olá! Sou seu assistente financeiro pessoal. Tenho acesso a todos os seus lançamentos e posso analisar gastos, identificar padrões e sugerir melhorias. Como posso ajudar?' },
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    setMsgs(m => [...m, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const res = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const { reply } = await res.json()
      setMsgs(m => [...m, { role: 'assistant', content: reply }])
    } catch {
      setMsgs(m => [...m, { role: 'assistant', content: 'Erro ao conectar. Tente novamente.' }])
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Sparkles size={18} className="text-brand-400" />
        <h1 className="text-xl font-semibold">Análise com IA</h1>
      </div>

      <div className="card flex flex-col" style={{ height: '65vh' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-brand-400 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-400 text-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                Analisando seus dados...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        <div className="px-5 py-2 flex gap-2 flex-wrap border-t border-gray-50">
          {SUGESTOES.map(s => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-3 p-4 border-t border-gray-100">
          <input
            className="field flex-1"
            placeholder="Pergunte sobre seus gastos..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            disabled={loading}
          />
          <button
            className="btn-primary px-3"
            onClick={() => send()}
            disabled={loading || !input.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
