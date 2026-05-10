'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    window.location.href = '/'
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">
            fin<span className="text-brand-400">track</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Controle financeiro pessoal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">E-mail</label>
            <input
              type="email" required autoFocus value={email}
              onChange={e => setEmail(e.target.value)}
              className="field"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Senha</label>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              className="field"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-400 hover:bg-brand-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
