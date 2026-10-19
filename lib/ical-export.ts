import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDays, echoIds, isoToDate, todayISO } from '@/lib/agenda'
import { serializeBooking } from '@/lib/agenda-server'

const notFound = () => new NextResponse('Not found', { status: 404 })

const compact = (iso: string) => iso.replaceAll('-', '')
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/**
 * Feed .ics do imóvel: reservas confirmadas e bloqueios, sem dados do hóspede (LGPD).
 * Com excludeChannelId, tira o que veio desse canal (link próprio de cada plataforma, evita loop).
 */
export async function icsResponse(token: string, excludeChannelId: string | null) {
  if (!/^[A-Za-z0-9_-]{32,}$/.test(token)) return notFound()
  const property = await prisma.property.findUnique({ where: { icalToken: token }, select: { id: true, name: true } })
  if (!property) return notFound()

  if (excludeChannelId) {
    const channel = await prisma.calendarChannel.findFirst({
      where: { id: excludeChannelId, propertyId: property.id },
      select: { id: true },
    })
    if (!channel) return notFound()
  }

  const rows = await prisma.booking.findMany({
    where: { propertyId: property.id, status: 'CONFIRMADA', endDate: { gte: isoToDate(addDays(todayISO(), -30)) } },
    orderBy: { startDate: 'asc' },
  })
  const all = rows.map((r) => ({ ...serializeBooking(r), updatedAt: r.updatedAt }))
  // Bloqueios-espelho (a plataforma devolvendo datas que ela leu daqui) não voltam no feed
  const echoes = echoIds(all)
  const events = all.filter((b) => !echoes.has(b.id) && (!excludeChannelId || b.channelId !== excludeChannelId))

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Staymet//Agenda//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Staymet',
    ...events.flatMap((b) => [
      'BEGIN:VEVENT',
      `UID:${b.id}@staymet.somar.ia.br`,
      `DTSTAMP:${stamp(b.updatedAt)}`,
      `DTSTART;VALUE=DATE:${compact(b.startDate)}`,
      `DTEND;VALUE=DATE:${compact(b.endDate)}`,
      'SUMMARY:Reservado – Staymet',
      'TRANSP:OPAQUE',
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ]

  return new NextResponse(lines.join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="staymet.ics"',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'X-Robots-Tag': 'noindex',
    },
  })
}
