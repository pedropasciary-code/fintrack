'use client'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Mudar para claro' : 'Mudar para escuro'}
      className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors shrink-0"
    >
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  )
}
