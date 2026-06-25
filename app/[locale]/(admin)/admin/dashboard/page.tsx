'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Building2, Users, Calendar, AlertCircle, BarChart3, Settings } from 'lucide-react'

interface DashboardStats {
  totalClients: number
  totalProperties: number
  activeReservationsToday: number
  pendingInspections: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalProperties: 0,
    activeReservationsToday: 0,
    pendingInspections: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch user to verify role
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok || userRes.status === 401) {
          router.push(`/${locale}/login`)
          return
        }

        const user = await userRes.json()
        if (user?.role !== 'ADMINISTRADOR') {
          router.push(`/${locale}/${user?.role?.toLowerCase()}/dashboard`)
          return
        }

        // Fetch stats from API
        const statsRes = await fetch('/api/admin/stats')
        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [locale, router])

  const statCards = [
    {
      title: 'Clientes Cadastrados',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Imóveis Ativos',
      value: stats.totalProperties,
      icon: Building2,
      color: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Reservas Ativas Hoje',
      value: stats.activeReservationsToday,
      icon: Calendar,
      color: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Vistorias Pendentes',
      value: stats.pendingInspections,
      icon: AlertCircle,
      color: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ]

  const quickAccessRoutes = [
    { label: 'Dashboard Gestor', href: `/${locale}/gestor/dashboard`, role: 'GESTOR' },
    { label: 'Dashboard Proprietário', href: `/${locale}/proprietario/dashboard`, role: 'PROPRIETARIO' },
    { label: 'Dashboard Anfitrião', href: `/${locale}/anfitriao/dashboard`, role: 'ANFITRIAO' },
    { label: 'Boas-vindas Hóspede', href: `/${locale}/hospede/boas-vindas`, role: 'HOSPEDE' },
    { label: 'Tarefas Prestador', href: `/${locale}/prestador/tarefas`, role: 'PRESTADOR' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-1">Visão geral da plataforma Staymet</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => {
            const IconComponent = stat.icon
            return (
              <Card key={stat.title} className={`p-6 ${stat.color} border-0`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                    <p className={`text-3xl font-bold ${stat.textColor} mt-2`}>{stat.value}</p>
                  </div>
                  <IconComponent className={`w-10 h-10 ${stat.textColor} opacity-20`} />
                </div>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gestão de Usuários */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Users className="w-6 h-6 text-primary mr-2" />
              <h2 className="text-lg font-bold">Gestão de Usuários</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Listar, criar e gerenciar usuários do sistema. Alterar roles, ativar/desativar contas.
            </p>
            <Link href={`/${locale}/admin/usuarios`}>
              <Button variant="outline" className="w-full">
                Acessar Usuários
              </Button>
            </Link>
          </Card>

          {/* Gestão de Propriedades */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Building2 className="w-6 h-6 text-primary mr-2" />
              <h2 className="text-lg font-bold">Gestão de Imóveis</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Visualizar todos os imóveis cadastrados, status, proprietário e última vistoria.
            </p>
            <Link href={`/${locale}/admin/imoveis`}>
              <Button variant="outline" className="w-full">
                Ver Imóveis
              </Button>
            </Link>
          </Card>

          {/* Vistorias Pendentes */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-primary mr-2" />
              <h2 className="text-lg font-bold">Vistorias Pendentes</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Validar vistorias digitais de entrada/saída de todas as propriedades.
            </p>
            <Link href={`/${locale}/admin/vistorias`}>
              <Button variant="outline" className="w-full">
                Validar Vistorias
              </Button>
            </Link>
          </Card>

          {/* Relatórios */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-6 h-6 text-primary mr-2" />
              <h2 className="text-lg font-bold">Relatórios</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Gerar relatórios de ocupação, receita, ocorrências e performance.
            </p>
            <Link href={`/${locale}/admin/relatorios`}>
              <Button variant="outline" className="w-full">
                Ver Relatórios
              </Button>
            </Link>
          </Card>
        </div>

        {/* Acesso Rápido a Personas */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Settings className="w-6 h-6 text-primary mr-2" />
            <h2 className="text-lg font-bold">Visualizar Como</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Acesse o dashboard de qualquer persona para testar a experiência do usuário.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {quickAccessRoutes.map((route) => (
              <Link key={route.role} href={route.href}>
                <Button variant="outline" className="w-full text-xs h-10">
                  {route.label}
                </Button>
              </Link>
            ))}
          </div>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700">
            <strong>Bem-vindo ao Painel Administrativo!</strong> Use este dashboard para gerenciar todos os aspectos da plataforma Staymet.
            Para retornar ao seu dashboard pessoal, clique na opção correspondente no menu.
          </p>
        </div>
      </div>
    </div>
  )
}
