// Agenda / Canais: tipos, cores, datas e detecção de conflitos (puro, serve no cliente e no servidor)

export const AGENDA_TZ = 'America/Fortaleza'

export type BookingSourceValue = 'AIRBNB' | 'BOOKING' | 'VRBO' | 'OLX' | 'DIRETO' | 'OUTRO' | 'BLOQUEIO'
export type ChannelPlatformValue = 'AIRBNB' | 'BOOKING' | 'VRBO' | 'OUTRO'

export const SOURCE_META: Record<BookingSourceValue, { label: string; color: string }> = {
  AIRBNB:   { label: 'Airbnb',   color: '#FF385C' },
  BOOKING:  { label: 'Booking',  color: '#003B95' },
  VRBO:     { label: 'Vrbo',     color: '#0EA5E9' },
  OLX:      { label: 'OLX',      color: '#6E0AD6' },
  DIRETO:   { label: 'Direto',   color: '#059669' },
  OUTRO:    { label: 'Outro',    color: '#F59E0B' },
  BLOQUEIO: { label: 'Bloqueio', color: '#64748B' },
}

export const PLATFORM_META: Record<ChannelPlatformValue, { label: string; color: string }> = {
  AIRBNB:  { label: 'Airbnb',  color: SOURCE_META.AIRBNB.color },
  BOOKING: { label: 'Booking', color: SOURCE_META.BOOKING.color },
  VRBO:    { label: 'Vrbo',    color: SOURCE_META.VRBO.color },
  OUTRO:   { label: 'Outro',   color: SOURCE_META.OUTRO.color },
}

/** Origens do lançamento manual (o resto vem dos canais) */
export const MANUAL_SOURCES = ['DIRETO', 'OLX', 'OUTRO'] as const

/** Reserva/bloqueio já serializado para a tela (datas em YYYY-MM-DD; endDate = check-out, exclusivo) */
export type AgendaBooking = {
  id: string
  propertyId: string
  source: BookingSourceValue
  channelId: string | null
  channelPlatform: ChannelPlatformValue | null
  startDate: string
  endDate: string
  guestName: string | null
  guestContact: string | null
  guestsCount: number | null
  amount: string | null
  notes: string | null
}

// ─── Datas (sempre YYYY-MM-DD, sem fuso) ───

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: AGENDA_TZ, year: 'numeric', month: '2-digit', day: '2-digit' })

/** Dia de hoje no fuso do imóvel */
export function todayISO(now = new Date()) {
  return dayFmt.format(now)
}
/** Dia (no fuso do imóvel) de um instante qualquer */
export function instantToISO(d: Date) {
  return dayFmt.format(d)
}
/** Coluna @db.Date do Prisma (meia-noite UTC) → YYYY-MM-DD */
export function dateToISO(d: Date) {
  return d.toISOString().slice(0, 10)
}
/** YYYY-MM-DD → Date para coluna @db.Date */
export function isoToDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`)
}
export function addDays(iso: string, n: number) {
  const d = isoToDate(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return dateToISO(d)
}
export function nightsBetween(start: string, end: string) {
  return Math.round((isoToDate(end).getTime() - isoToDate(start).getTime()) / 86_400_000)
}
/** 2026-10-20 → 20/10 */
export function fmtDay(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}
export function isISODate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(isoToDate(s).getTime()) && dateToISO(isoToDate(s)) === s
}

// ─── Rótulos ───

export function bookingLabel(b: Pick<AgendaBooking, 'source' | 'channelPlatform' | 'guestName'>) {
  if (b.source === 'BLOQUEIO') {
    return b.channelPlatform ? `Bloqueio (${PLATFORM_META[b.channelPlatform].label})` : 'Bloqueio'
  }
  const name = SOURCE_META[b.source].label
  return b.guestName ? `${name} – ${b.guestName}` : name
}

export function bookingRange(b: Pick<AgendaBooking, 'startDate' | 'endDate'>) {
  const n = nightsBetween(b.startDate, b.endDate)
  return `${fmtDay(b.startDate)} a ${fmtDay(b.endDate)} · ${n} ${n === 1 ? 'noite' : 'noites'}`
}

// ─── Conflitos ───

type Span = Pick<AgendaBooking, 'id' | 'source' | 'channelId' | 'startDate' | 'endDate'>

export const overlaps = (a: Span, b: Span) => a.startDate < b.endDate && b.startDate < a.endDate

/**
 * Bloqueio importado que só "espelha" ocupação de outra origem (ex.: o Airbnb bloqueia as datas de uma reserva
 * do Booking que leu do Staymet e devolve isso no feed dele). Não é conflito nem deve ser reexportado.
 */
export function echoIds<T extends Span>(bookings: T[]) {
  const echoes = new Set<string>()
  for (const b of bookings) {
    if (b.source !== 'BLOQUEIO' || !b.channelId) continue
    const others = bookings.filter((o) => o.id !== b.id && o.channelId !== b.channelId && overlaps(o, b))
    if (others.length === 0) continue
    let covered = true
    for (let d = b.startDate, i = 0; d < b.endDate && i < 400; d = addDays(d, 1), i++) {
      if (!others.some((o) => o.startDate <= d && d < o.endDate)) {
        covered = false
        break
      }
    }
    if (covered) echoes.add(b.id)
  }
  return echoes
}

/** Pares de reservas/bloqueios confirmados que se sobrepõem (bloqueios-espelho não contam) */
export function findConflicts<T extends Span>(bookings: T[]) {
  const echoes = echoIds(bookings)
  const list = bookings.filter((b) => !echoes.has(b.id)).sort((a, b) => a.startDate.localeCompare(b.startDate))
  const pairs: [T, T][] = []
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length && list[j].startDate < list[i].endDate; j++) {
      if (overlaps(list[i], list[j])) pairs.push([list[i], list[j]])
    }
  }
  return pairs
}

/** wa.me para o anfitrião com as duas reservas descritas; sem telefone, o WhatsApp abre para escolher o contato */
export function conflictWhatsappHref(
  phone: string | null,
  propertyName: string,
  a: Pick<AgendaBooking, 'source' | 'channelPlatform' | 'guestName' | 'startDate' | 'endDate'>,
  b: Pick<AgendaBooking, 'source' | 'channelPlatform' | 'guestName' | 'startDate' | 'endDate'>,
) {
  const line = (x: typeof a) => `• ${bookingLabel(x)}: ${fmtDay(x.startDate)} a ${fmtDay(x.endDate)} (check-out)`
  const text = [
    `Conflito de datas no imóvel ${propertyName}:`,
    line(a),
    line(b),
    'Por favor, verifique nas plataformas e cancele ou ajuste uma das reservas.',
  ].join('\n')
  let digits = (phone ?? '').replace(/\D/g, '')
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`
  const base = digits.length >= 12 ? `https://wa.me/${digits}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(text)}`
}
