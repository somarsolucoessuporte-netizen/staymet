import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Building2,
  CheckSquare,
  AlertTriangle,
  DollarSign,
  Calendar,
  User,
  Bell,
} from 'lucide-react'
import Link from 'next/link'

async function getDashboardData() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const now = new Date()
    const today = new Date(now)
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    const [
      properties,
      activeReservations,
      pendingTasks,
      openOccurrences,
      monthRevenue,
      todayTasks,
      notifications,
    ] = await Promise.all([
      prisma.property.count({ where: { active: true } }),
      prisma.reservation.count({ where: { status: { in: ['CONFIRMADA', 'EM_ANDAMENTO'] } } }),
      prisma.task.count({ where: { status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } } }),
      prisma.occurrence.count({ where: { status: { in: ['ABERTA', 'EM_ANDAMENTO'] } } }),
      prisma.reservation.aggregate({
        where: {
          checkIn: { gte: startOfMonth, lte: endOfMonth },
          status: { not: 'CANCELADA' },
        },
        _sum: { totalAmount: true },
      }),
      prisma.task.findMany({
        where: {
          scheduledFor: { gte: startOfDay, lte: endOfDay },
          status: { not: 'CANCELADA' },
        },
        include: {
          property: { select: { name: true } },
          assignee: { select: { name: true } },
        },
        take: 5,
      }),
      prisma.notification.findMany({
        where: { read: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    return {
      properties,
      activeReservations,
      pendingTasks,
      openOccurrences,
      monthRevenue: Number(monthRevenue._sum.totalAmount ?? 0),
      todayTasks,
      notifications,
    }
  } catch (e) {
    console.error('[gestor/dashboard] getDashboardData error:', e)
    throw e
  }
}

export default async function GestorDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  try {
    const test = await prisma.$queryRaw`SELECT 1 as test`
    console.log('[DB-TEST] Conexão OK:', test)
  } catch (err: any) {
    console.error('[DB-TEST] FALHA NA CONEXÃO:', err.message)
    console.error('[DB-TEST] Stack:', err.stack)
    throw new Error('DB_CONNECTION_FAILED: ' + err.message)
  }
  const { locale } = await params
  const data = await getDashboardData()

  if (!data) return null

  const stats = [
    {
      label: 'Imóveis Ativos',
      value: data.properties,
      icon: Building2,
      color: 'text-accent',
      bg: 'bg-accent/10',
      href: `/${locale}/gestor/properties`,
    },
    {
      label: 'Reservas Ativas',
      value: data.activeReservations,
      icon: Calendar,
      color: 'text-primary',
      bg: 'bg-primary/10',
      href: `/${locale}/gestor/properties`,
    },
    {
      label: 'Tarefas Pendentes',
      value: data.pendingTasks,
      icon: CheckSquare,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      href: `/${locale}/gestor/tarefas`,
    },
    {
      label: 'Ocorrências',
      value: data.openOccurrences,
      icon: AlertTriangle,
      color: 'text-danger',
      bg: 'bg-danger/10',
      href: `/${locale}/gestor/ocorrencias`,
    },
  ]

  return (
    <div className="p-4 pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              timeZone: 'America/Fortaleza',
            }).format(new Date())}
          </p>
        </div>
        <Link href={`/${locale}/gestor/notificacoes`}>
          <div className="relative">
            <Bell className="h-6 w-6 text-muted-foreground" />
            {data.notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {data.notifications.length}
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* Receita do mês */}
      <Card className="bg-primary text-white border-0">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-accent" />
            <span className="text-sm text-white/70">Receita do Mês</span>
          </div>
          <div className="text-3xl font-black text-accent">
            {formatCurrency(Number(data.monthRevenue))}
          </div>
          <p className="text-xs text-white/50 mt-1">
            {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'America/Fortaleza' }).format(new Date())}
          </p>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow active:scale-[0.98]">
              <CardContent className="pt-4">
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="text-2xl font-black text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground leading-tight">{stat.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Tarefas de hoje */}
      {data.todayTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Tarefas de Hoje</h2>
            <Link href={`/${locale}/gestor/tarefas`} className="text-xs text-accent font-medium">
              Ver todas
            </Link>
          </div>
          <div className="space-y-2">
            {data.todayTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>{task.property.name}</span>
                        {task.assignee && (
                          <>
                            <span>•</span>
                            <User className="h-3 w-3" />
                            <span>{task.assignee.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Notificações recentes */}
      {data.notifications.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground mb-3">Notificações</h2>
          <div className="space-y-2">
            {data.notifications.slice(0, 3).map((notif) => (
              <Card key={notif.id} className="border-l-4 border-l-accent">
                <CardContent className="py-3">
                  <p className="font-medium text-sm">{notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{notif.body}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{formatDate(notif.createdAt)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="pb-4 text-center">
        <p className="text-[11px] text-muted-foreground/50">Powered by Somar Soluções Digitais</p>
      </div>
    </div>
  )
}
