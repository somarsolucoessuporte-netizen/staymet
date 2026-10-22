import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { GUIDE_ACTIONS, GUIDE_CARD_KEYS } from '@/lib/guide-events'
import { isoToDate, todayISO } from '@/lib/agenda'

// Contador do guia público (sem login, sem dado pessoal). Nunca quebra o guia: qualquer problema responde 204.

const schema = z.object({
  cardKey: z.enum(GUIDE_CARD_KEYS),
  action: z.enum(GUIDE_ACTIONS),
  partnerId: z.string().min(1).max(40).nullish(),
})

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|headless|lighthouse|curl|wget|python|axios|node-fetch/i

// Limite simples por IP (por instância da função): 60 eventos/min
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 60
const hits = new Map<string, { start: number; count: number }>()

function limited(ip: string) {
  const now = Date.now()
  if (hits.size > 5_000) {
    for (const [k, v] of hits) if (now - v.start > WINDOW_MS) hits.delete(k)
  }
  const h = hits.get(ip)
  if (!h || now - h.start > WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 })
    return false
  }
  h.count++
  return h.count > MAX_PER_WINDOW
}

const done = () => new Response(null, { status: 204 })

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ua = req.headers.get('user-agent') ?? ''
    if (!ua || BOT_UA.test(ua)) return done()

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local'
    if (limited(ip)) return done()

    const { id } = await params
    const parsed = schema.safeParse(JSON.parse(await req.text()))
    if (!parsed.success) return done()
    const { cardKey, action } = parsed.data
    const partnerId = parsed.data.partnerId ?? null

    const property = await prisma.property.findFirst({ where: { id, active: true }, select: { id: true } })
    if (!property) return done()

    // Só conta parceiro ligado a este imóvel (evita inflar o relatório de outro parceiro)
    if (partnerId) {
      const link = await prisma.propertyPartner.findUnique({
        where: { propertyId_partnerId: { propertyId: id, partnerId } },
        select: { partnerId: true },
      })
      if (!link) return done()
    }

    // Origem da reserva em andamento hoje (Agenda); bloqueios não contam
    const today = isoToDate(todayISO())
    const current = await prisma.booking.findFirst({
      where: { propertyId: id, status: 'CONFIRMADA', source: { not: 'BLOQUEIO' }, startDate: { lte: today }, endDate: { gte: today } },
      orderBy: { endDate: 'asc' },
      select: { source: true },
    })

    await prisma.guideEvent.create({
      data: { propertyId: id, partnerId, cardKey, action, bookingSource: current?.source ?? null },
    })
  } catch {
    // ignora: o guia segue funcionando
  }
  return done()
}
