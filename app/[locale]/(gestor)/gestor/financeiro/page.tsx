import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, TrendingUp, Calendar } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'

export default async function GestorFinanceiroPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const today = new Date()
  const months = []

  for (let i = 0; i < 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    months.push(d)
  }

  const monthlyData = await Promise.all(
    months.map(async (month) => {
      const start = new Date(month.getFullYear(), month.getMonth(), 1)
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)

      const result = await prisma.reservation.aggregate({
        where: {
          checkIn: { gte: start, lte: end },
          status: { not: 'CANCELADA' },
        },
        _sum: { totalAmount: true },
        _count: true,
      })

      return {
        month,
        label: new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: 'America/Fortaleza' }).format(month),
        total: Number(result._sum.totalAmount ?? 0),
        count: result._count,
      }
    })
  )

  const currentMonth = monthlyData[0]
  const previousMonth = monthlyData[1]
  const growth = previousMonth.total > 0
    ? ((currentMonth.total - previousMonth.total) / previousMonth.total) * 100
    : 0

  const recentReservations = await prisma.reservation.findMany({
    where: { status: { not: 'CANCELADA' } },
    include: { property: { select: { name: true } } },
    orderBy: { checkIn: 'desc' },
    take: 15,
  })

  return (
    <div className="p-4 pt-6 space-y-6">
      <PageHeader title="Financeiro" />

      {/* Receita mês atual */}
      <Card className="bg-primary text-white border-0">
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-accent" />
            <span className="text-sm text-white/70">Receita em {currentMonth.label}</span>
          </div>
          <div className="text-3xl font-black text-accent">{formatCurrency(currentMonth.total)}</div>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className={`h-4 w-4 ${growth >= 0 ? 'text-success' : 'text-danger'}`} />
            <span className={`text-sm ${growth >= 0 ? 'text-success' : 'text-danger'}`}>
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}% vs mês anterior
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">{currentMonth.count} reservas</p>
        </CardContent>
      </Card>

      {/* Gráfico de barras simples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Últimos 6 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {monthlyData.slice().reverse().map((m) => {
              const max = Math.max(...monthlyData.map((x) => x.total), 1)
              const height = max > 0 ? (m.total / max) * 100 : 0
              return (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-sm bg-accent/80 min-h-[4px] transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de reservas com valores */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Reservas Recentes</h2>
        </div>
        <div className="space-y-2">
          {recentReservations.map((res) => (
            <Card key={res.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{res.guestName}</p>
                    <p className="text-xs text-muted-foreground">{res.property.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(res.checkIn)} → {formatDate(res.checkOut)}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    {res.totalAmount ? (
                      <p className="font-bold text-sm text-accent">{formatCurrency(Number(res.totalAmount))}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                    <StatusBadge status={res.status} />
                    {res.platform && (
                      <p className="text-xs text-muted-foreground mt-0.5">{res.platform}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
