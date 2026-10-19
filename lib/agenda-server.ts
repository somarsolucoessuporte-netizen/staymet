import { randomBytes } from 'crypto'
import type { Booking, CalendarChannel } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentDbUser } from '@/lib/guia-access'
import { dateToISO, findConflicts, isoToDate, todayISO, type AgendaBooking } from '@/lib/agenda'

type DbUser = NonNullable<Awaited<ReturnType<typeof getCurrentDbUser>>>

// ADMIN/GESTOR: todos os imóveis. ANFITRIAO/PROPRIETARIO: só os próprios (vínculo ativo ou dono).
const FULL_ACCESS_ROLES = ['ADMINISTRADOR', 'GESTOR']

function ownWhere(user: DbUser) {
  if (user.role === 'ANFITRIAO') return { users: { some: { userId: user.id, active: true } } }
  if (user.role === 'PROPRIETARIO') {
    return { OR: [{ ownerId: user.id }, { users: { some: { userId: user.id, active: true } } }] }
  }
  return null
}

/** Imóveis cuja agenda/canais o usuário pode ver e editar */
export async function listAgendaProperties(user: DbUser) {
  const own = FULL_ACCESS_ROLES.includes(user.role) ? {} : ownWhere(user)
  if (!own) return []
  return prisma.property.findMany({
    where: { active: true, ...own },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}

export async function canManageAgenda(user: DbUser, propertyId: string) {
  if (FULL_ACCESS_ROLES.includes(user.role)) return true
  const own = ownWhere(user)
  if (!own) return false
  const found = await prisma.property.findFirst({ where: { id: propertyId, ...own }, select: { id: true } })
  return !!found
}

/** Token secreto dos links .ics (gerado na primeira vez que alguém abre Canais/Agenda) */
export async function ensureIcalToken(propertyId: string) {
  const current = await prisma.property.findUnique({ where: { id: propertyId }, select: { icalToken: true } })
  if (current?.icalToken) return current.icalToken
  await prisma.property.updateMany({
    where: { id: propertyId, icalToken: null },
    data: { icalToken: randomBytes(32).toString('base64url') },
  })
  const fresh = await prisma.property.findUnique({ where: { id: propertyId }, select: { icalToken: true } })
  return fresh!.icalToken!
}

export function serializeBooking(b: Booking & { channel?: Pick<CalendarChannel, 'platform'> | null }): AgendaBooking {
  return {
    id: b.id,
    propertyId: b.propertyId,
    source: b.source,
    channelId: b.channelId,
    channelPlatform: b.channel?.platform ?? null,
    startDate: dateToISO(b.startDate),
    endDate: dateToISO(b.endDate),
    guestName: b.guestName,
    guestContact: b.guestContact,
    guestsCount: b.guestsCount,
    amount: b.amount ? b.amount.toFixed(2) : null,
    notes: b.notes,
  }
}

export type PropertyConflict = {
  propertyId: string
  propertyName: string
  hostPhone: string | null
  a: AgendaBooking
  b: AgendaBooking
}

/** Conflitos atuais/futuros (reservas ou bloqueios confirmados sobrepostos) por imóvel */
export async function getConflicts(propertyIds: string[]): Promise<PropertyConflict[]> {
  if (propertyIds.length === 0) return []
  const rows = await prisma.booking.findMany({
    where: { propertyId: { in: propertyIds }, status: 'CONFIRMADA', endDate: { gt: isoToDate(todayISO()) } },
    include: { channel: { select: { platform: true } } },
    orderBy: { startDate: 'asc' },
  })
  if (rows.length < 2) return []

  const byProperty = new Map<string, AgendaBooking[]>()
  for (const r of rows) {
    const list = byProperty.get(r.propertyId) ?? []
    list.push(serializeBooking(r))
    byProperty.set(r.propertyId, list)
  }

  const out: PropertyConflict[] = []
  const withConflicts = [...byProperty].map(([id, list]) => [id, findConflicts(list)] as const).filter(([, c]) => c.length)
  if (withConflicts.length === 0) return []

  const props = await prisma.property.findMany({
    where: { id: { in: withConflicts.map(([id]) => id) } },
    select: {
      id: true, name: true,
      users: { where: { active: true, role: 'ANFITRIAO' }, select: { user: { select: { phone: true } } } },
      owner: { select: { phone: true } },
    },
  })
  for (const [id, pairs] of withConflicts) {
    const p = props.find((x) => x.id === id)
    if (!p) continue
    const hostPhone = p.users.find((u) => u.user.phone)?.user.phone ?? p.owner.phone ?? null
    for (const [a, b] of pairs) out.push({ propertyId: id, propertyName: p.name, hostPhone, a, b })
  }
  return out
}

/** Check-ins e check-outs (só reservas, sem bloqueios) entre hoje e hoje+days */
export async function getUpcomingMovements(propertyIds: string[], days = 7) {
  if (propertyIds.length === 0) return []
  const today = todayISO()
  const from = isoToDate(today)
  const to = isoToDate(dateToISO(new Date(from.getTime() + days * 86_400_000)))
  const rows = await prisma.booking.findMany({
    where: {
      propertyId: { in: propertyIds },
      status: 'CONFIRMADA',
      source: { not: 'BLOQUEIO' },
      OR: [{ startDate: { gte: from, lte: to } }, { endDate: { gte: from, lte: to } }],
    },
    include: { channel: { select: { platform: true } }, property: { select: { name: true } } },
    orderBy: { startDate: 'asc' },
  })
  const moves: { kind: 'checkin' | 'checkout'; date: string; booking: AgendaBooking; propertyName: string }[] = []
  for (const r of rows) {
    const b = serializeBooking(r)
    if (b.startDate >= today && r.startDate <= to) moves.push({ kind: 'checkin', date: b.startDate, booking: b, propertyName: r.property.name })
    if (b.endDate >= today && r.endDate <= to) moves.push({ kind: 'checkout', date: b.endDate, booking: b, propertyName: r.property.name })
  }
  // No mesmo dia, o check-out vem antes do check-in (a casa vira)
  return moves.sort((x, y) => x.date.localeCompare(y.date) || (x.kind === 'checkout' ? -1 : 1))
}
