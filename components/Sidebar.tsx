'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PlusCircle, PieChart, Bell, Sparkles } from 'lucide-react'

const NAV = [
  { href: '/',            label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/lancamentos', label: 'Lançar',         icon: PlusCircle },
  { href: '/categorias',  label: 'Categorias',     icon: PieChart },
  { href: '/limites',     label: 'Limite semanal', icon: Bell },
  { href: '/ia',          label: 'Análise IA',     icon: Sparkles },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-52 shrink-0 bg-white border-r border-gray-100 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <span className="text-base font-semibold">
          fin<span className="text-brand-400">track</span>
        </span>
      </div>
      <nav className="flex-1 py-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-l-2 ${
                active
                  ? 'text-brand-400 border-brand-400 bg-brand-50 font-medium'
                  : 'text-gray-500 border-transparent hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
      </div>
    </aside>
  )
}
