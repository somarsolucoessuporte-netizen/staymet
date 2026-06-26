'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Building2, Users, Calendar, AlertCircle, BarChart3, Settings, ExternalLink } from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()
  const [stats, setStats] = useState({
    totalClients: 0,
    totalProperties: 0,
    activeReservationsToday: 0,
    pendingInspections: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) { router.push(`/${locale}/login`); return }
        const user = await userRes.json()
        if (!user?.role) { router.push(`/${locale}/login`); return }
        if (user.role !== 'ADMINISTRADOR') {
          router.push(`/${locale}/login`); return
        }
        try {
          const statsRes = await fetch('/api/admin/stats')
          if (statsRes.ok) setStats(await statsRes.json())
        } catch { /* stats falhou, continua sem */ }
      } catch { router.push(`/${locale}/login`) }
      finally { setLoading(false) }
    }
    checkAuth()
  }, [locale, router])

  const statCards = [
    { title: 'Clientes',       value: stats.totalClients,           icon: Users,        bg: 'bg-blue-50',   color: 'text-blue-600' },
    { title: 'Imóveis ativos', value: stats.totalProperties,        icon: Building2,    bg: 'bg-green-50',  color: 'text-green-600' },
    { title: 'Reservas hoje',  value: stats.activeReservationsToday, icon: Calendar,    bg: 'bg-purple-50', color: 'text-purple-600' },
    { title: 'Vis. pendentes', value: stats.pendingInspections,     icon: AlertCircle,  bg: 'bg-orange-50', color: 'text-orange-600' },
  ]

  const quickAccess = [
    { label: 'Dashboard Gestor',      href: `/${locale}/gestor/dashboard?viewAs=GESTOR`,              role: 'GESTOR' },
    { label: 'Dashboard Proprietário', href: `/${locale}/proprietario/dashboard?viewAs=PROPRIETARIO`, role: 'PROPRIETARIO' },
    { label: 'Dashboard Anfitrião',    href: `/${locale}/anfitriao/dashboard?viewAs=ANFITRIAO`,       role: 'ANFITRIAO' },
    { label: 'Boas-vindas Hóspede',   href: `/${locale}/hospede/boas-vindas?viewAs=HOSPEDE`,         role: 'HOSPEDE' },
    { label: 'Tarefas Prestador',     href: `/${locale}/prestador/tarefas?viewAs=PRESTADOR`,          role: 'PRESTADOR' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1A56DB] mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-5 lg:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-[#1A56DB] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>S</span>
            </div>
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Admin</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Painel Administrativo
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Visão geral da plataforma Staymet</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {statCards.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.title} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon size={17} className={s.color} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.title}</p>
              </div>
            )
          })}
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {[
            { icon: Users,        title: 'Gestão de Usuários',   desc: 'Listar, criar e gerenciar usuários do sistema.', href: `/${locale}/admin/usuarios` },
            { icon: Building2,    title: 'Gestão de Imóveis',    desc: 'Visualizar todos os imóveis e seus status.',      href: `/${locale}/admin/imoveis` },
            { icon: AlertCircle,  title: 'Vistorias Pendentes',  desc: 'Validar vistorias digitais de entrada/saída.',    href: `/${locale}/admin/vistorias` },
            { icon: BarChart3,    title: 'Relatórios',           desc: 'Relatórios de ocupação, receita e performance.',  href: `/${locale}/admin/relatorios` },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.title} href={item.href}>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon size={17} className="text-[#1A56DB]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm group-hover:text-[#1A56DB] transition-colors">
                        {item.title}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Visualizar como */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">
              <Settings size={17} className="text-gray-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Visualizar como</p>
              <p className="text-gray-400 text-xs">Acesse o dashboard de qualquer persona para testar</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {quickAccess.map((route) => (
              <Link key={route.role} href={route.href} target="_blank">
                <div className="flex items-center gap-1.5 justify-center px-3 py-2.5 rounded-xl border border-gray-200 hover:border-[#1A56DB] hover:bg-blue-50 text-gray-700 hover:text-[#1A56DB] text-xs font-medium transition-all group">
                  <ExternalLink size={11} className="opacity-50 group-hover:opacity-100" />
                  {route.label}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-6">
          Powered by Somar Soluções Digitais
        </p>
      </div>
    </div>
  )
}
