import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, TrendingUp, TrendingDown, Calendar, BarChart3, Building2 } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { FinanceBarChart } from '@/components/gestor/FinanceBarChart'

export default async function GestorFinanceiroPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const today = new Date()
  const months = Array.from({ length: 6 }, (_, i) => new Date(today.getFullYear(), today.getMonth() - i, 1))

  // Buscar todas as propriedades com modelo financeiro
  const properties = await prisma.property.findMany({
    select: {
      id: true,
      name: true,
      financeModel: true,
      commissionRate: true,
      monthlyFee: true,
    },
  })

  const monthlyData = await Promise.all(
    months.map(async (month) => {
      const start = new Date(month.getFullYear(), month.getMonth(), 1)
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)

      const reservations = await prisma.reservation.findMany({
        where: {
          checkIn: { gte: start, lte: end },
          status: { not: 'CANCELADA' },
        },
        select: { totalAmount: true, propertyId: true },
      })

      let receita = 0
      let gestora = 0

      for (const res of reservations) {
        const amount = Number(res.totalAmount ?? 0)
        receita += amount

        const prop = properties.find(p => p.id === res.propertyId)
        const model = prop?.financeModel ?? 'COMISSAO'
        const commRate = Number(prop?.commissionRate ?? 20) / 100
        const monthFee = Number(prop?.monthlyFee ?? 0)

        if (model === 'COMISSAO') gestora += amount * commRate
        else if (model === 'MENSALIDADE') gestora += monthFee
        else gestora += amount * commRate + monthFee
      }

      const label = new Intl.DateTimeFormat('pt-BR', {
        month: 'short', year: '2-digit', timeZone: 'America/Fortaleza',
      }).format(month)

      return {
        label: label.replace('.', '').replace(' de ', '/'),
        receita,
        gestora: Math.min(gestora, receita),
        repasse: Math.max(0, receita - gestora),
        count: reservations.length,
      }
    })
  )

  const currentMonth = monthlyData[0]
  const previousMonth = monthlyData[1]
  const growth = previousMonth.receita > 0
    ? ((currentMonth.receita - previousMonth.receita) / previousMonth.receita) * 100
    : 0

  const recentReservations = await prisma.reservation.findMany({
    where: { status: { not: 'CANCELADA' } },
    include: { property: { select: { name: true, financeModel: true, commissionRate: true, monthlyFee: true } } },
    orderBy: { checkIn: 'desc' },
    take: 15,
  })

  const chartData = [...monthlyData].reverse()

  const totalReceita = monthlyData.reduce((s, m) => s + m.receita, 0)
  const totalGestora = monthlyData.reduce((s, m) => s + m.gestora, 0)
  const totalRepasse = monthlyData.reduce((s, m) => s + m.repasse, 0)

  return (
    <div className="p-4 pt-6 space-y-5">
      <PageHeader title="Financeiro" description="Últimos 6 meses" />

      {/* Receita mês atual */}
      <div className="bg-[#0F172A] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign size={15} strokeWidth={1.5} className="text-[#1A56DB]" />
          <span className="text-sm text-white/50">Receita em {currentMonth.label}</span>
        </div>
        <div className="text-3xl font-black text-[#1A56DB] mb-2">{formatCurrency(currentMonth.receita)}</div>
        <div className="flex items-center gap-2">
          {growth >= 0
            ? <TrendingUp size={14} strokeWidth={1.5} className="text-[#10B981]" />
            : <TrendingDown size={14} strokeWidth={1.5} className="text-[#EF4444]" />}
          <span className={`text-sm font-medium ${growth >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {growth >= 0 ? '+' : ''}{growth.toFixed(1)}% vs mês anterior
          </span>
          <span className="text-white/30 text-xs ml-1">{currentMonth.count} reservas</span>
        </div>
      </div>

      {/* Cards de resumo 6m */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Receita bruta', value: totalReceita, color: '#1A56DB' },
          { label: 'Gestora (6m)', value: totalGestora, color: '#F59E0B' },
          { label: 'Repasse (6m)', value: totalRepasse, color: '#10B981' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-[10px] font-medium text-gray-400 mb-1">{item.label}</p>
            <p className="text-sm font-bold" style={{ color: item.color }}>
              {formatCurrency(item.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfico recharts */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} strokeWidth={1.5} className="text-gray-400" />
          <p className="text-sm font-semibold text-gray-700">Comparativo últimos 6 meses</p>
        </div>
        <FinanceBarChart data={chartData} />
      </div>

      {/* Resumo por imóvel (mês atual) */}
      {properties.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} strokeWidth={1.5} className="text-gray-400" />
            <p className="text-sm font-semibold text-gray-700">Por imóvel — {currentMonth.label}</p>
          </div>
          <div className="space-y-2">
            {properties.map(prop => {
              const modelLabels: Record<string, string> = {
                COMISSAO: `${prop.commissionRate ?? 20}% comissão`,
                MENSALIDADE: `R$ ${Number(prop.monthlyFee ?? 0).toLocaleString('pt-BR')} fixo`,
                HIBRIDO: `${prop.commissionRate ?? 20}% + mensalidade`,
              }
              return (
                <div key={prop.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{prop.name}</p>
                    <p className="text-xs text-gray-400">{modelLabels[prop.financeModel] ?? prop.financeModel}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    prop.financeModel === 'COMISSAO' ? 'bg-green-100 text-green-700'
                    : prop.financeModel === 'MENSALIDADE' ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                  }`}>
                    {prop.financeModel}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Reservas recentes */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={15} strokeWidth={1.5} className="text-gray-400" />
          <h2 className="font-semibold text-gray-800">Reservas Recentes</h2>
        </div>
        <div className="space-y-2">
          {recentReservations.map((res) => {
            const amount = Number(res.totalAmount ?? 0)
            const prop = res.property
            const model = prop?.financeModel ?? 'COMISSAO'
            const commRate = Number(prop?.commissionRate ?? 20) / 100
            const fee = Number(prop?.monthlyFee ?? 0)
            const gestAmt = model === 'COMISSAO' ? amount * commRate
              : model === 'MENSALIDADE' ? fee
              : amount * commRate + fee
            const repasse = Math.max(0, amount - gestAmt)

            return (
              <div key={res.id} className="bg-white rounded-xl border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{res.guestName}</p>
                    <p className="text-xs text-gray-400">{res.property.name}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(res.checkIn)} — {formatDate(res.checkOut)}
                    </p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    {amount > 0 ? (
                      <>
                        <p className="font-bold text-sm text-[#1A56DB]">{formatCurrency(amount)}</p>
                        {gestAmt > 0 && (
                          <p className="text-[10px] text-[#F59E0B] font-medium">gestora {formatCurrency(gestAmt)}</p>
                        )}
                        {repasse > 0 && (
                          <p className="text-[10px] text-[#10B981] font-medium">repasse {formatCurrency(repasse)}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-300">—</p>
                    )}
                    <StatusBadge status={res.status} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
