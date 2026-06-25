import { prisma } from '@/lib/prisma'
import { CalendarView } from './CalendarView'

export default async function GestorCalendarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const { locale } = await params
  const sp = await searchParams

  const now = new Date()
  const month = sp.month ? parseInt(sp.month, 10) : now.getMonth() + 1
  const year = sp.year ? parseInt(sp.year, 10) : now.getFullYear()

  const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)

  const reservations = await prisma.reservation.findMany({
    where: {
      status: { not: 'CANCELADA' },
      OR: [
        { checkIn: { gte: startOfMonth, lte: endOfMonth } },
        { checkOut: { gte: startOfMonth, lte: endOfMonth } },
        { checkIn: { lte: startOfMonth }, checkOut: { gte: endOfMonth } },
      ],
    },
    include: {
      property: { select: { name: true } },
    },
    orderBy: { checkIn: 'asc' },
  })

  return (
    <CalendarView
      locale={locale}
      year={year}
      month={month}
      reservations={reservations.map((r) => ({
        id: r.id,
        guestName: r.guestName,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        status: r.status,
        property: r.property,
      }))}
    />
  )
}
