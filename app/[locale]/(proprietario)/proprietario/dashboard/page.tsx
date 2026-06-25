import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Building2, Calendar, DollarSign, AlertTriangle } from 'lucide-react'

export default async function ProprietarioDashboardPage({
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
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const properties = await prisma.property.findMany({
    where: { ownerId: dbUser.id },
    include: {
      reservations: {
        where: { status: { in: ['CONFIRMADA', 'EM_ANDAMENTO'] } },
        take: 3,
        orderBy: { checkIn: 'asc' },
      },
      _count: {
        select: {
          occurrences: { where: { status: { in: ['ABERTA', 'EM_ANDAMENTO'] } } },
        },
      },
    },
  })

  const propertyIds = properties.map((p) => p.id)
  const monthRevenue = await prisma.reservation.aggregate({
    where: {
      propertyId: { in: propertyIds },
      checkIn: { gte: startOfMonth },
      status: { not: 'CANCELADA' },
    },
    _sum: { totalAmount: true },
  })

  return (
    <div className="p-4 pt-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Meus Imóveis</h1>
        <p className="text-sm text-muted-foreground">Visão geral</p>
      </div>

      {/* Receita do mês */}
      <Card className="bg-primary text-white border-0">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-accent" />
            <span className="text-sm text-white/70">Receita do Mês</span>
          </div>
          <div className="text-3xl font-black text-accent">
            {formatCurrency(Number(monthRevenue._sum.totalAmount ?? 0))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-3 text-center">
            <Building2 className="h-5 w-5 text-accent mx-auto mb-1" />
            <div className="text-xl font-black">{properties.length}</div>
            <div className="text-xs text-muted-foreground">Imóveis</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 text-center">
            <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
            <div className="text-xl font-black">{properties.reduce((s, p) => s + p.reservations.length, 0)}</div>
            <div className="text-xs text-muted-foreground">Reservas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 text-center">
            <AlertTriangle className="h-5 w-5 text-danger mx-auto mb-1" />
            <div className="text-xl font-black">{properties.reduce((s, p) => s + p._count.occurrences, 0)}</div>
            <div className="text-xs text-muted-foreground">Ocorrências</div>
          </CardContent>
        </Card>
      </div>

      {/* Reservas ativas */}
      {properties.some((p) => p.reservations.length > 0) && (
        <div>
          <h2 className="font-semibold mb-3">Reservas Ativas</h2>
          <div className="space-y-2">
            {properties.flatMap((p) =>
              p.reservations.map((res) => (
                <Card key={res.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{res.guestName}</p>
                        <p className="text-xs text-muted-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(res.checkIn)} → {formatDate(res.checkOut)}</p>
                      </div>
                      <StatusBadge status={res.status} />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      <div className="text-center pb-4">
        <p className="text-[11px] text-muted-foreground/50">Powered by Somar Soluções Digitais</p>
      </div>
    </div>
  )
}
