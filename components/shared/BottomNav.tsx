'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  CheckSquare,
  Users,
  DollarSign,
  AlertTriangle,
  ClipboardCheck,
  History,
  Wifi,
  MessageSquare,
  ListTodo,
} from 'lucide-react'

type NavItem = {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const gestorNav: NavItem[] = [
  { href: '/gestor/dashboard', icon: LayoutDashboard, label: 'Início' },
  { href: '/gestor/properties', icon: Building2, label: 'Imóveis' },
  { href: '/gestor/tarefas', icon: CheckSquare, label: 'Tarefas' },
  { href: '/gestor/ocorrencias', icon: AlertTriangle, label: 'Ocorrências' },
  { href: '/gestor/financeiro', icon: DollarSign, label: 'Financeiro' },
]

const proprietarioNav: NavItem[] = [
  { href: '/proprietario/dashboard', icon: LayoutDashboard, label: 'Início' },
  { href: '/proprietario/properties', icon: Building2, label: 'Imóveis' },
  { href: '/proprietario/relatorios', icon: DollarSign, label: 'Relatórios' },
]

const anfitriaoNav: NavItem[] = [
  { href: '/anfitriao/dashboard', icon: LayoutDashboard, label: 'Início' },
  { href: '/anfitriao/checkin', icon: ClipboardCheck, label: 'Check-in' },
  { href: '/anfitriao/checkout', icon: ClipboardCheck, label: 'Check-out' },
  { href: '/anfitriao/ocorrencias', icon: AlertTriangle, label: 'Ocorrências' },
]

const hospedeNav: NavItem[] = [
  { href: '/hospede/boas-vindas', icon: LayoutDashboard, label: 'Início' },
  { href: '/hospede/informacoes', icon: Wifi, label: 'Wi-Fi / Info' },
  { href: '/hospede/solicitacoes', icon: ListTodo, label: 'Pedidos' },
  { href: '/hospede/suporte', icon: MessageSquare, label: 'Suporte' },
]

const prestadorNav: NavItem[] = [
  { href: '/prestador/tarefas', icon: ListTodo, label: 'Tarefas' },
  { href: '/prestador/historico', icon: History, label: 'Histórico' },
]

const navByRole: Record<string, NavItem[]> = {
  gestor: gestorNav,
  proprietario: proprietarioNav,
  anfitriao: anfitriaoNav,
  hospede: hospedeNav,
  prestador: prestadorNav,
}

interface BottomNavProps {
  role: string
  locale: string
}

export function BottomNav({ role, locale }: BottomNavProps) {
  const pathname = usePathname()
  const items = navByRole[role.toLowerCase()] ?? gestorNav

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {items.map((item) => {
          const fullHref = `/${locale}${item.href}`
          const isActive = pathname.includes(item.href)
          return (
            <Link
              key={item.href}
              href={fullHref}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg min-w-0 flex-1',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
              <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
