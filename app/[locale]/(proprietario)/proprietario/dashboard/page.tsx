import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Building2, Calendar, TrendingUp, AlertTriangle,
  ClipboardCheck, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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

  const firstName = dbUser.name.split(' ')[0]
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const daysInMonth = endOfMonth.getDate()

  const properties = await prisma.property.findMany({
    where: { ownerId: dbUser.id },
    include: {
      reservations: {
        where: {
          status: { in: ['CONFIRMADA', 'EM_ANDAMENTO'] },
          OR: [
            { checkIn: { lte: endOfMonth }, checkOut: { gte: startOfMonth } },
          ],
        },
        orderBy: { checkIn: 'asc' },
      },
      _count: {
        select: {
          occurrences: { where: { status: { in: ['ABERTA', 'EM_ANDAMENTO'] } } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  const propertyIds = properties.map((p) => p.id)

  const [monthRevenueAgg, inspections] = await Promise.all([
    prisma.reservation.aggregate({
      where: {
        propertyId: { in: propertyIds },
        checkIn: { gte: startOfMonth, lte: endOfMonth },
        status: { not: 'CANCELADA' },
      },
      _sum: { totalAmount: true },
    }),
    prisma.inspection.findMany({
      where: { property: { ownerId: dbUser.id } },
      include: { property: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  const monthRevenue = Number(monthRevenueAgg._sum.totalAmount ?? 0)
  const ownerNet = monthRevenue * 0.85

  // Calcular noites reservadas e taxa de ocupação
  const bookedNights = properties.flatMap((p) => p.reservations).reduce((sum, r) => {
    const start = r.checkIn > startOfMonth ? r.checkIn : startOfMonth
    const end = r.checkOut < endOfMonth ? r.checkOut : endOfMonth
    return sum + Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86400000))
  }, 0)
  const totalCapacity = properties.length * daysInMonth
  const occupancyRate = totalCapacity > 0 ? Math.round((bookedNights / totalCapacity) * 100) : 0

  const todayDate = new Date()
  const propertiesWithStatus = properties.map((p) => ({
    ...p,
    isOccupied: p.reservations.some(
      (r) =>
        r.status === 'EM_ANDAMENTO' ||
        (r.status === 'CONFIRMADA' && r.checkIn <= todayDate && r.checkOut >= todayDate)
    ),
    monthRevenue: p.reservations.reduce((s, r) => s + Number(r.totalAmount ?? 0), 0),
  }))

  const monthLabel = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="p-5 lg:p-8 pb-24 lg:pb-8 max-w-5xl mx-auto">

      {/* Cabeçalho */}
      <div className="mb-6">
        <p className="text-gray-500 text-sm capitalize">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Olá, {firstName}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">Aqui está o resumo dos seus imóveis.</p>
      </div>

      {/* Cards financeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0F172A] rounded-2xl p-5 text-white">
          <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Receita do mês</p>
          <p className="text-3xl font-bold">{formatCurrency(monthRevenue)}</p>
          <p className="text-white/30 text-xs mt-1 capitalize">{monthLabel}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Seu repasse</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(ownerNet)}</p>
          <p className="text-gray-400 text-xs mt-1">Após comissão da gestora (15%)</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Taxa de ocupação</p>
          <p className="text-2xl font-bold text-gray-900">{occupancyRate}%</p>
          <p className="text-gray-400 text-xs mt-1">{bookedNights} noites reservadas</p>
        </div>
      </div>

      {/* Imóveis */}
      {properties.length > 0 && (
        <>
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Seus imóveis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {propertiesWithStatus.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                <div className="h-32 bg-gradient-to-br from-blue-50 to-blue-100 relative">
                  {p.coverImageUrl && (
                    <img src={p.coverImageUrl} alt={p.name} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-2.5 right-2.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold text-white ${
                      p.isOccupied ? 'bg-blue-600' : 'bg-emerald-500'
                    }`}>
                      {p.isOccupied ? 'Ocupado' : 'Disponível'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{p.name}</h3>
                  <p className="text-gray-400 text-xs mb-3">{p.city}, {p.state}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Calendar size={11} />
                      {p.reservations.length} reserva{p.reservations.length !== 1 ? 's' : ''}
                    </span>
                    {p.monthRevenue > 0 && (
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(p.monthRevenue)}
                      </span>
                    )}
                  </div>
                  {p._count.occurrences > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
                      <AlertTriangle size={11} />
                      {p._count.occurrences} ocorrência{p._count.occurrences !== 1 ? 's' : ''} aberta{p._count.occurrences !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Vistorias */}
      {inspections.length > 0 && (
        <>
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Últimas vistorias</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            {inspections.map((insp, i) => (
              <div
                key={insp.id}
                className={`flex items-center gap-4 p-4 ${i < inspections.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                {insp.photos[0] ? (
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <img src={insp.photos[0]} className="w-full h-full object-cover" alt="Foto" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck size={20} className="text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">
                    {insp.type === 'ENTRADA' ? 'Vistoria de entrada' : 'Vistoria de saída'}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5 truncate">{insp.property.name}</p>
                  <p className="text-gray-400 text-xs">
                    {format(new Date(insp.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${
                  insp.signedByGuest
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {insp.signedByGuest ? 'Assinada' : 'Pendente'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Bloqueio de datas */}
      <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-3 border border-blue-100">
        <div className="w-9 h-9 bg-[#1A56DB]/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Calendar size={17} className="text-[#1A56DB]" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">Reserva para uso próprio</p>
          <p className="text-gray-500 text-xs">Bloqueie datas quando quiser usar seu imóvel</p>
        </div>
        <Link href={`/${locale}/proprietario/bloqueios`}
          className="text-[#1A56DB] text-sm font-medium flex items-center gap-1 flex-shrink-0">
          Gerenciar <ArrowRight size={13} />
        </Link>
      </div>

      <p className="text-center text-[11px] text-gray-400 mt-6 pb-2">
        Powered by Somar Soluções Digitais
      </p>
    </div>
  )
}
