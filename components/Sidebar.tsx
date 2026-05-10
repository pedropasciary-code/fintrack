'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, PlusCircle, PieChart, Bell,
  Repeat2, Settings, History, Flag, CreditCard, BarChart2,
  LogOut, type LucideIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type NavLink = { href: string; label: string; icon: LucideIcon }
type NavItem = NavLink | '---'

const NAV: NavItem[] = [
  { href: '/',              label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/lancamentos',   label: 'Lançar',          icon: PlusCircle },
  { href: '/historico',     label: 'Histórico',       icon: History },
  '---',
  { href: '/categorias',    label: 'Categorias',      icon: PieChart },
  { href: '/relatorio',     label: 'Relatório',       icon: BarChart2 },
  '---',
  { href: '/metas',         label: 'Metas',           icon: Flag },
  { href: '/parcelamentos', label: 'Parcelamentos',   icon: CreditCard },
  { href: '/fixos',         label: 'Fixos mensais',   icon: Repeat2 },
  '---',
  { href: '/limites',       label: 'Limite semanal',  icon: Bell },
  { href: '/config',        label: 'Configurações',   icon: Settings },
]

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const path = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }
  return (
    <aside className="w-52 shrink-0 bg-white border-r border-gray-100 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <span className="text-base font-semibold">
          fin<span className="text-brand-400">track</span>
        </span>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map((item, i) =>
          item === '---' ? (
            <hr key={i} className="mx-4 my-2 border-gray-100" />
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-l-2 ${
                path === item.href
                  ? 'text-brand-400 border-brand-400 bg-brand-50 font-medium'
                  : 'text-gray-500 border-transparent hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          )
        )}
      </nav>
      <div className="px-5 py-4 border-t border-gray-100 space-y-3">
        <p className="text-xs text-gray-400">
          {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          <button
            onClick={handleLogout}
            title="Sair"
            className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
