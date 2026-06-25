import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import {
  Building2, TrendingUp, ClipboardList, AlertTriangle,
  ArrowRight, LogIn, LogOut, CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return null

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [
    propertyCount,
    activeReservations,
    pendingTasks,
    openOccurrences,
    monthRevenue,
    checkInsToday,
    checkOutsToday,
    todayTasks,
    openOccurrencesList,
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
    prisma.reservation.findMany({
      where: {
        checkIn: { gte: startOfDay, lte: endOfDay },
        status: { in: ['CONFIRMADA', 'EM_ANDAMENTO'] },
      },
      include: { property: { select: { name: true, checkInTime: true } } },
      take: 5,
    }),
    prisma.reservation.findMany({
      where: {
        checkOut: { gte: startOfDay, lte: endOfDay },
        status: 'EM_ANDAMENTO',
      },
      include: { property: { select: { name: true, checkOutTime: true } } },
      take: 5,
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
      take: 6,
    }),
    prisma.occurrence.findMany({
      where: { status: { in: ['ABERTA', 'EM_ANDAMENTO'] } },
      include: { property: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ])

  return {
    userName: dbUser.name.split(' ')[0],
    propertyCount,
    activeReservations,
    pendingTasks,
    openOccurrences,
    monthRevenue: Number(monthRevenue._sum.totalAmount ?? 0),
    checkInsToday,
    checkOutsToday,
    todayTasks,
    openOccurrencesList,
  }
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const priorityConfig: Record<string, { label: string; color: string; dot: string }> = {
  URGENTE: { label: 'Urgente', color: 'text-red-600', dot: 'bg-red-500' },
  ALTA: { label: 'Alta', color: 'text-orange-600', dot: 'bg-orange-400' },
  MEDIA: { label: 'Média', color: 'text-yellow-600', dot: 'bg-yellow-400' },
  BAIXA: { label: 'Baixa', color: 'text-green-600', dot: 'bg-green-400' },
}

const taskStatusConfig: Record<string, { label: string; color: string }> = {
  PENDENTE: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  EM_ANDAMENTO: { label: 'Em andamento', color: 'bg-blue-100 text-blue-700' },
  CONCLUIDA: { label: 'Concluída', color: 'bg-green-100 text-green-700' },
}

export default async function GestorDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const data = await getDashboardData()

  if (!data) return null

  const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })
  const monthLabel = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })

  const kpis = [
    {
      label: 'Imóveis ativos',
      value: data.propertyCount,
      icon: Building2,
      iconBg: 'bg-blue-50',
      iconColor: 'text-[#1A56DB]',
      href: `/${locale}/gestor/properties`,
    },
    {
      label: 'Receita do mês',
      value: formatCurrency(data.monthRevenue),
      icon: TrendingUp,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      href: `/${locale}/gestor/financeiro`,
      sub: monthLabel,
    },
    {
      label: 'Tarefas pendentes',
      value: data.pendingTasks,
      icon: ClipboardList,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      href: `/${locale}/gestor/tarefas`,
    },
    {
      label: 'Ocorrências abertas',
      value: data.openOccurrences,
      icon: AlertTriangle,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      href: `/${locale}/gestor/ocorrencias`,
    },
  ]

  return (
    <div className="p-5 lg:p-8 pb-24 lg:pb-8 space-y-6 max-w-6xl mx-auto">

      {/* ── CABEÇALHO ── */}
      <div>
        <p className="text-sm text-gray-400 capitalize">{today}</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {greeting()}, {data.userName} 👋
        </h1>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-5 hover:shadow-md hover:border-gray-200 transition-all group">
              <div className={`w-9 h-9 rounded-xl ${kpi.iconBg} flex items-center justify-center mb-3`}>
                <kpi.icon size={17} className={kpi.iconColor} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{kpi.label}</p>
              {kpi.sub && <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{kpi.sub}</p>}
            </div>
          </Link>
        ))}
      </div>

      {/* ── CHECK-INS E CHECK-OUTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Check-ins */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                <LogIn size={15} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Check-ins hoje</p>
                <p className="text-xs text-gray-400">{data.checkInsToday.length} chegada{data.checkInsToday.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <Link href={`/${locale}/gestor/calendario`} className="text-xs text-[#1A56DB] font-medium hover:underline flex items-center gap-1">
              Ver <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.checkInsToday.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Nenhum check-in hoje</p>
            ) : (
              data.checkInsToday.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.property.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.guestName}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {r.property.checkInTime}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Check-outs */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                <LogOut size={15} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Check-outs hoje</p>
                <p className="text-xs text-gray-400">{data.checkOutsToday.length} saída{data.checkOutsToday.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <Link href={`/${locale}/gestor/calendario`} className="text-xs text-[#1A56DB] font-medium hover:underline flex items-center gap-1">
              Ver <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.checkOutsToday.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Nenhum check-out hoje</p>
            ) : (
              data.checkOutsToday.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.property.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.guestName}</p>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    {r.property.checkOutTime}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── TAREFAS DO DIA ── */}
      {data.todayTasks.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                <ClipboardList size={15} className="text-amber-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Tarefas de hoje</p>
            </div>
            <Link href={`/${locale}/gestor/tarefas`} className="text-xs text-[#1A56DB] font-medium hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.todayTasks.map((task) => {
              const st = taskStatusConfig[task.status] ?? { label: task.status, color: 'bg-gray-100 text-gray-600' }
              return (
                <div key={task.id} className="flex items-center gap-3 px-5 py-3">
                  <CheckCircle2 size={16} className="text-gray-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {task.property.name}
                      {task.assignee && ` · ${task.assignee.name}`}
                    </p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${st.color}`}>
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── OCORRÊNCIAS ABERTAS ── */}
      {data.openOccurrencesList.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertTriangle size={15} className="text-red-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Ocorrências abertas</p>
            </div>
            <Link href={`/${locale}/gestor/ocorrencias`} className="text-xs text-[#1A56DB] font-medium hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.openOccurrencesList.map((occ) => {
              const p = priorityConfig[occ.priority] ?? { label: occ.priority, color: 'text-gray-600', dot: 'bg-gray-400' }
              return (
                <div key={occ.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{occ.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{occ.property.name}</p>
                  </div>
                  <span className={`text-[11px] font-semibold flex-shrink-0 ${p.color}`}>{p.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
