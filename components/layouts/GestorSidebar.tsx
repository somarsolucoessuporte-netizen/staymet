'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Building2, Calendar, Users,
  ClipboardList, AlertTriangle, DollarSign,
  LogOut, Bell, Search, Menu, X, Home,
} from 'lucide-react'

const navItems = [
  { label: 'Visão Geral', path: '/gestor/dashboard', icon: LayoutDashboard },
  { label: 'Imóveis', path: '/gestor/properties', icon: Building2 },
  { label: 'Calendário', path: '/gestor/calendario', icon: Calendar },
  { label: 'Tarefas', path: '/gestor/tarefas', icon: ClipboardList },
  { label: 'Ocorrências', path: '/gestor/ocorrencias', icon: AlertTriangle },
  { label: 'Equipe', path: '/gestor/equipe', icon: Users },
  { label: 'Financeiro', path: '/gestor/financeiro', icon: DollarSign },
]

const mobileNav = [
  { label: 'Início', path: '/gestor/dashboard', icon: Home },
  { label: 'Imóveis', path: '/gestor/properties', icon: Building2 },
  { label: 'Tarefas', path: '/gestor/tarefas', icon: ClipboardList },
  { label: 'Ocorrências', path: '/gestor/ocorrencias', icon: AlertTriangle },
  { label: 'Equipe', path: '/gestor/equipe', icon: Users },
]

interface GestorSidebarProps {
  children: React.ReactNode
  locale: string
  user: { name: string; email: string }
}

export function GestorSidebar({ children, locale, user }: GestorSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path: string) => pathname.includes(path)
  const href = (path: string) => `/${locale}${path}`
  const initial = user.name.charAt(0).toUpperCase()

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#0F172A] flex-shrink-0">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <Link href={href('/gestor/dashboard')} className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-[#1A56DB] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#1A56DB]/30">
              <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>S</span>
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight leading-none" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Staymet</span>
              <p className="text-white/30 text-[10px] font-medium tracking-widest uppercase mt-0.5">Gestão</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider px-3 mb-3">
            Principal
          </p>
          {navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                href={href(item.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                  active
                    ? 'bg-[#1A56DB] text-white'
                    : 'text-white/55 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={15} className={active ? 'text-white' : 'text-white/40 group-hover:text-white transition-colors'} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-white/5 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[#1A56DB] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">{initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.name}</p>
              <p className="text-white/35 text-xs truncate">{user.email}</p>
            </div>
          </div>
          <Link
            href="/api/auth/logout"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/35 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut size={14} />
            <span className="text-sm">Sair</span>
          </Link>
        </div>
      </aside>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header fixo */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3.5 flex items-center gap-3 flex-shrink-0 sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 bg-[#1A56DB] rounded-lg flex items-center justify-center shadow-md shadow-[#1A56DB]/20">
              <span className="text-white font-bold text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>S</span>
            </div>
            <span className="text-gray-900 font-bold text-lg" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Staymet</span>
          </div>

          {/* Busca desktop */}
          <div className="hidden lg:block flex-1 max-w-xs">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar imóvel, reserva..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <Bell size={18} />
            </button>
            <div className="lg:hidden w-8 h-8 rounded-full bg-[#1A56DB] flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{initial}</span>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ── BOTTOM NAV MOBILE ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center z-30 safe-area-bottom">
        {mobileNav.map((item) => {
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              href={href(item.path)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                active ? 'text-[#1A56DB]' : 'text-gray-400'
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ── SIDEBAR MOBILE OVERLAY ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0F172A] flex flex-col">
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#1A56DB] rounded-lg flex items-center justify-center shadow-md shadow-[#1A56DB]/20">
                  <span className="text-white font-bold text-xs" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>S</span>
                </div>
                <span className="text-white font-semibold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Staymet</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-white/40 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => {
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    href={href(item.path)}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      active ? 'bg-[#1A56DB] text-white' : 'text-white/55 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon size={15} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>
        </div>
      )}
    </div>
  )
}
