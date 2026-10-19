import * as ical from 'node-ical'
import type { BookingSource, ChannelPlatform } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { addDays, instantToISO, isoToDate, todayISO } from '@/lib/agenda'

const FETCH_TIMEOUT_MS = 15_000
const MAX_BYTES = 5_000_000
/** Eventos que terminaram há mais que isso nem são importados */
const PAST_DAYS = 60

export type SyncResult =
  | { channelId: string; ok: true; events: number; cancelled: number }
  | { channelId: string; ok: false; error: string }

/** Só https e nada de endereço local/IP direto */
export function validateImportUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    throw new Error('Link inválido. Cole o link completo do calendário (.ics).')
  }
  if (url.protocol !== 'https:') throw new Error('O link precisa começar com https://')
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.local') || /^[\d.]+$/.test(host) || host.includes(':')) {
    throw new Error('Link inválido para calendário.')
  }
  return url
}

async function fetchFeed(raw: string) {
  const url = validateImportUrl(raw)
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      cache: 'no-store',
      redirect: 'follow',
      headers: { 'User-Agent': 'Staymet/1.0 (+https://staymet.somar.ia.br)', Accept: 'text/calendar, */*' },
    })
    if (!res.url.startsWith('https://')) throw new Error('O link redirecionou para um endereço sem https.')
    if (!res.ok) throw new Error(`A plataforma respondeu com erro ${res.status}. Confira o link.`)
    const text = await res.text()
    if (text.length > MAX_BYTES) throw new Error('Calendário grande demais.')
    if (!text.includes('BEGIN:VCALENDAR')) throw new Error('O link não devolveu um calendário iCal (.ics).')
    return text
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') throw new Error('Tempo esgotado (15 s) ao baixar o calendário.')
    throw e
  } finally {
    clearTimeout(timer)
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Data só-dia vem em horário local do servidor; data-hora vai para o fuso do imóvel */
function eventDay(d: ical.DateWithTimeZone) {
  if (d.dateOnly) return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return instantToISO(d)
}

const PLATFORM_SOURCE: Record<ChannelPlatform, BookingSource> = {
  AIRBNB: 'AIRBNB', BOOKING: 'BOOKING', VRBO: 'VRBO', OUTRO: 'OUTRO',
}

const textOf = (v: unknown) => (typeof v === 'string' ? v : v && typeof v === 'object' && 'val' in v ? String(v.val) : '')

/**
 * "Not available"/"Blocked"/"Closed" → bloqueio. "Reserved"/"Booked"... → reserva da plataforma.
 * Sem indicação de reserva também vira bloqueio.
 */
function classify(summary: string, description: string, platform: ChannelPlatform): BookingSource {
  if (/not available|unavailable|blocked|closed|bloquead|indispon/i.test(summary)) return 'BLOQUEIO'
  if (/reserv|booked|booking|confirmad|hóspede|guest/i.test(`${summary} ${description}`)) return PLATFORM_SOURCE[platform]
  return 'BLOQUEIO'
}

type FeedEvent = { uid: string; source: BookingSource; startDate: string; endDate: string }

export function parseFeed(text: string, platform: ChannelPlatform): FeedEvent[] {
  const data = ical.sync.parseICS(text)
  const minEnd = addDays(todayISO(), -PAST_DAYS)
  const byUid = new Map<string, FeedEvent>()
  for (const item of Object.values(data)) {
    if (!item || item.type !== 'VEVENT') continue
    const ev = item as ical.VEvent
    if (!ev.start || String(ev.status ?? '').toUpperCase() === 'CANCELLED') continue
    const startDate = eventDay(ev.start)
    let endDate = ev.end ? eventDay(ev.end) : addDays(startDate, 1)
    if (endDate <= startDate) endDate = addDays(startDate, 1)
    if (endDate < minEnd) continue
    const summary = textOf(ev.summary)
    const uid = ev.uid?.trim() || `${startDate}_${endDate}_${summary}`.slice(0, 200)
    byUid.set(uid, { uid, startDate, endDate, source: classify(summary, textOf(ev.description), platform) })
  }
  return [...byUid.values()]
}

/** Baixa o feed do canal, faz upsert por UID e cancela (sem apagar) eventos futuros que sumiram */
export async function syncChannel(channelId: string): Promise<SyncResult> {
  const channel = await prisma.calendarChannel.findUnique({ where: { id: channelId } })
  if (!channel) return { channelId, ok: false, error: 'Canal não encontrado.' }

  try {
    const events = parseFeed(await fetchFeed(channel.importUrl), channel.platform)
    const today = isoToDate(todayISO())

    const results = await prisma.$transaction([
      ...events.map((ev) =>
        prisma.booking.upsert({
          where: { channelId_externalUid: { channelId: channel.id, externalUid: ev.uid } },
          create: {
            propertyId: channel.propertyId,
            channelId: channel.id,
            externalUid: ev.uid,
            source: ev.source,
            startDate: isoToDate(ev.startDate),
            endDate: isoToDate(ev.endDate),
          },
          update: { source: ev.source, startDate: isoToDate(ev.startDate), endDate: isoToDate(ev.endDate), status: 'CONFIRMADA' },
        }),
      ),
      prisma.booking.updateMany({
        where: {
          channelId: channel.id,
          status: 'CONFIRMADA',
          endDate: { gt: today },
          externalUid: { notIn: events.map((e) => e.uid) },
        },
        data: { status: 'CANCELADA' },
      }),
      prisma.calendarChannel.update({
        where: { id: channel.id },
        data: { lastSyncAt: new Date(), lastStatus: 'OK', lastError: null },
      }),
    ])
    const cancelled = results[events.length] as { count: number }

    return { channelId, ok: true, events: events.length, cancelled: cancelled.count }
  } catch (e) {
    const error = (e instanceof Error ? e.message : 'Erro ao sincronizar.').slice(0, 300)
    await prisma.calendarChannel.update({
      where: { id: channel.id },
      data: { lastSyncAt: new Date(), lastStatus: 'ERRO', lastError: error },
    })
    return { channelId, ok: false, error }
  }
}

/** Sincroniza vários canais com concorrência limitada */
async function syncMany(ids: string[], concurrency = 4) {
  const results: SyncResult[] = []
  let next = 0
  const worker = async () => {
    while (next < ids.length) results.push(await syncChannel(ids[next++]))
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) }, worker))
  return results
}

export async function syncProperty(propertyId: string) {
  const channels = await prisma.calendarChannel.findMany({ where: { propertyId, active: true }, select: { id: true } })
  return syncMany(channels.map((c) => c.id))
}

export async function syncAllChannels() {
  const channels = await prisma.calendarChannel.findMany({
    where: { active: true, property: { active: true } },
    select: { id: true },
  })
  return syncMany(channels.map((c) => c.id))
}
