import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Types ────────────────────────────────────────────────────────────────────

export type Lancamento = {
  id: number
  descricao: string
  valor: number
  categoria: string
  tipo: 'gasto' | 'ganho'
  data: string
  created_at: string
}

// ─── Categories ───────────────────────────────────────────────────────────────

export const CATS_GASTO = [
  { value: 'alimentacao', label: 'Alimentação',  emoji: '🍽️' },
  { value: 'transporte',  label: 'Transporte',   emoji: '🚗' },
  { value: 'moradia',     label: 'Moradia',      emoji: '🏠' },
  { value: 'saude',       label: 'Saúde',        emoji: '❤️' },
  { value: 'lazer',       label: 'Lazer',        emoji: '🎮' },
  { value: 'educacao',    label: 'Educação',     emoji: '📚' },
  { value: 'vestuario',   label: 'Vestuário',    emoji: '👕' },
  { value: 'servicos',    label: 'Assinaturas',  emoji: '📱' },
  { value: 'outros',      label: 'Outros',       emoji: '📦' },
]

export const CATS_GANHO = [
  { value: 'salario',      label: 'Salário',      emoji: '💰' },
  { value: 'freelance',    label: 'Freelance',    emoji: '💻' },
  { value: 'investimento', label: 'Investimento', emoji: '📈' },
  { value: 'outros',       label: 'Outros',       emoji: '📦' },
]

export const ALL_CATS = [...CATS_GASTO, ...CATS_GANHO]

export const CAT_COLORS: Record<string, string> = {
  alimentacao:  '#1D9E75',
  transporte:   '#378ADD',
  moradia:      '#BA7517',
  saude:        '#D85A30',
  lazer:        '#7F77DD',
  educacao:     '#639922',
  vestuario:    '#D4537E',
  servicos:     '#888780',
  outros:       '#B4B2A9',
  salario:      '#1D9E75',
  freelance:    '#5DCAA5',
  investimento: '#378ADD',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function startOfWeek(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

export function isThisWeek(dateStr: string) {
  return new Date(dateStr + 'T12:00:00') >= startOfWeek()
}

export function isThisMonth(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const n = new Date()
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
}
