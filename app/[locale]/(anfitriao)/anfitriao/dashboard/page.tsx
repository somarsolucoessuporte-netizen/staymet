import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TaskCard } from '@/components/shared/TaskCard'
import { formatDate } from '@/lib/utils'
import { Calendar, CheckSquare, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function AnfitriãoDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return null

  const today = new Date()
  const todayStart = new Date(today.setHours(0, 0, 0, 0))
  const todayEnd = new Date(today.setHours(23, 59, 59, 999))

  const [todayTasks, checkinsToday, checkoutsToday, openOccurrences] = await Promise.all([
    prisma.task.findMany({
      where: {
        assigneeId: dbUser.id,
        scheduledFor: { gte: todayStart, lte: todayEnd },
        status: { not: 'CANCELADA' },
      },
      include: { property: { select: { name: true } } },
      take: 10,
    }),
    prisma.reservation.findMany({
      where: {
        checkIn: { gte: todayStart, lte: todayEnd },
        status: 'CONFIRMADA',
      },
      include: { property: { select: { name: true } } },
      take: 5,
    }),
    prisma.reservation.findMany({
      where: {
        checkOut: { gte: todayStart, lte: todayEnd },
        status: 'EM_ANDAMENTO',
      },
      include: { property: { select: { name: true } } },
      take: 5,
    }),
    prisma.occurrence.count({
      where: { status: { in: ['ABERTA', 'EM_ANDAMENTO'] } },
    }),
  ])

  return (
    <div className="p-4 pt-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Olá, {dbUser.name.split(' ')[0]}!</h1>
        <p className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Fortaleza' }).format(new Date())}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="pt-3">
            <Calendar className="h-5 w-5 text-success mx-auto mb-1" />
            <div className="text-xl font-black text-success">{checkinsToday.length}</div>
            <div className="text-xs text-muted-foreground">Check-ins</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-3">
            <Calendar className="h-5 w-5 text-accent mx-auto mb-1" />
            <div className="text-xl font-black text-accent">{checkoutsToday.length}</div>
            <div className="text-xs text-muted-foreground">Check-outs</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-3">
            <AlertTriangle className="h-5 w-5 text-danger mx-auto mb-1" />
            <div className="text-xl font-black text-danger">{openOccurrences}</div>
            <div className="text-xs text-muted-foreground">Ocorrências</div>
          </CardContent>
        </Card>
      </div>

      {/* Check-ins do dia */}
      {checkinsToday.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3 text-success">Check-ins Hoje</h2>
          <div className="space-y-2">
            {checkinsToday.map((res) => (
              <Link key={res.id} href={`/${locale}/anfitriao/checkin/${res.id}`}>
                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-success">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{res.guestName}</p>
                        <p className="text-xs text-muted-foreground">{res.property.name}</p>
                      </div>
                      <StatusBadge status={res.status} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Check-outs do dia */}
      {checkoutsToday.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3 text-accent">Check-outs Hoje</h2>
          <div className="space-y-2">
            {checkoutsToday.map((res) => (
              <Link key={res.id} href={`/${locale}/anfitriao/checkout/${res.id}`}>
                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-accent">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{res.guestName}</p>
                        <p className="text-xs text-muted-foreground">{res.property.name}</p>
                      </div>
                      <StatusBadge status={res.status} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tarefas do dia */}
      {todayTasks.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Minhas Tarefas Hoje</h2>
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <TaskCard
                key={task.id}
                title={task.title}
                type={task.type}
                status={task.status}
                propertyName={task.property.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
