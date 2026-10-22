import { createHmac, timingSafeEqual } from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { addDays, AGENDA_TZ, SOURCE_META, todayISO } from '@/lib/agenda'
import { getCategoryMeta } from '@/lib/guia'
import { CARD_KEY_LABEL, CONTACT_ACTIONS, type GuideAction } from '@/lib/guide-events'

// Relatórios do contador do Guia do Hóspede (painel do anfitrião e link público do parceiro)

export const PERIODS = {
  '30d': 'Últimos 30 dias',
  mes: 'Este mês',
  '90d': 'Últimos 90 dias',
  '12m': 'Últimos 12 meses',
} as const
export type Periodo = keyof typeof PERIODS

export type ReportRange = { periodo: Periodo; label: string; fromISO: string; toISO: string; from: Date; to: Date }

/** Início do dia (YYYY-MM-DD) no fuso da Agenda (UTC-3, sem horário de verão) */
const dayStart = (iso: string) => new Date(`${iso}T03:00:00Z`)

/** Primeiro dia do mês, n meses antes do mês de iso */
function monthsBack(iso: string, n: number) {
  const d = new Date(`${iso.slice(0, 7)}-01T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() - n)
  return d.toISOString().slice(0, 10)
}

export function resolvePeriod(raw: string | undefined, allowed: Periodo[] = ['30d', 'mes', '90d']): ReportRange {
  const periodo: Periodo = raw && (allowed as string[]).includes(raw) ? (raw as Periodo) : allowed[0]
  const toISO = todayISO()
  const fromISO =
    periodo === 'mes' ? `${toISO.slice(0, 7)}-01`
    : periodo === '90d' ? addDays(toISO, -89)
    : periodo === '12m' ? monthsBack(toISO, 11)
    : addDays(toISO, -29)
  return { periodo, label: PERIODS[periodo], fromISO, toISO, from: dayStart(fromISO), to: dayStart(addDays(toISO, 1)) }
}

/** 2026-10-22 → 22/10/2026 */
export const fmtDate = (iso: string) => iso.split('-').reverse().join('/')

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
/** 2026-10 → out/2026 */
export const fmtMonth = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]}/${ym.slice(0, 4)}`

const sourceLabel = (s: string | null) =>
  s ? (SOURCE_META[s as keyof typeof SOURCE_META]?.label ?? s) : 'Sem reserva na Agenda'
const sourceColor = (s: string | null) => (s ? (SOURCE_META[s as keyof typeof SOURCE_META]?.color ?? '#94A3B8') : '#CBD5E1')

// ─── Relatório do imóvel ───

export type RankingRow = {
  key: string
  partnerId: string | null
  name: string
  category: string
  opens: number
  actions: number
  whatsapp: number
}

export async function getPropertyReport(propertyId: string, range: ReportRange) {
  const where = { propertyId, createdAt: { gte: range.from, lt: range.to } }

  const [grouped, bySource, weekly] = await Promise.all([
    prisma.guideEvent.groupBy({ by: ['cardKey', 'partnerId', 'action'], where, _count: { _all: true } }),
    prisma.guideEvent.groupBy({ by: ['bookingSource'], where: { ...where, action: { not: 'abrir_guia' } }, _count: { _all: true } }),
    prisma.$queryRaw<{ week: string; n: number }[]>(Prisma.sql`
      SELECT to_char(date_trunc('week', ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${AGENDA_TZ}), 'YYYY-MM-DD') AS week,
             count(*)::int AS n
      FROM "GuideEvent"
      WHERE "propertyId" = ${propertyId} AND "createdAt" >= ${range.from} AND "createdAt" < ${range.to} AND action <> 'abrir_guia'
      GROUP BY 1 ORDER BY 1`),
  ])

  let guideOpens = 0
  let clicks = 0
  let whatsapp = 0
  const rows = new Map<string, RankingRow>()
  const partnerIds = new Set<string>()

  for (const g of grouped) {
    const n = g._count._all
    if (g.action === 'abrir_guia') {
      guideOpens += n
      continue
    }
    clicks += n
    if (g.action === 'whatsapp') whatsapp += n
    // Ação com parceiro (inclusive o anfitrião na folha de emergência) conta para o parceiro
    const key = g.partnerId ?? g.cardKey
    if (g.partnerId) partnerIds.add(g.partnerId)
    const row = rows.get(key) ?? { key, partnerId: g.partnerId, name: CARD_KEY_LABEL[g.cardKey] ?? g.cardKey, category: 'Guia', opens: 0, actions: 0, whatsapp: 0 }
    if (g.action === 'abrir_card') row.opens += n
    else row.actions += n
    if (g.action === 'whatsapp') row.whatsapp += n
    rows.set(key, row)
  }

  if (partnerIds.size > 0) {
    const partners = await prisma.partner.findMany({ where: { id: { in: [...partnerIds] } }, select: { id: true, name: true, category: true } })
    for (const p of partners) {
      const row = rows.get(p.id)
      if (row) Object.assign(row, { name: p.name, category: getCategoryMeta(p.category)?.label ?? p.category })
    }
  }

  const ranking = [...rows.values()].sort((a, b) => b.opens + b.actions - (a.opens + a.actions) || a.name.localeCompare(b.name))

  // Semanas do período (segunda-feira), sem buracos
  const counts = new Map(weekly.map((w) => [w.week, Number(w.n)]))
  const weeks: { week: string; n: number }[] = []
  const first = new Date(`${range.fromISO}T00:00:00Z`)
  first.setUTCDate(first.getUTCDate() - ((first.getUTCDay() + 6) % 7))
  for (let d = first; d.toISOString().slice(0, 10) <= range.toISO; d.setUTCDate(d.getUTCDate() + 7)) {
    const iso = d.toISOString().slice(0, 10)
    weeks.push({ week: iso, n: counts.get(iso) ?? 0 })
  }

  const sources = bySource
    .map((s) => ({ source: s.bookingSource, label: sourceLabel(s.bookingSource), color: sourceColor(s.bookingSource), n: s._count._all }))
    .sort((a, b) => (a.source === null ? 1 : b.source === null ? -1 : b.n - a.n))

  return { guideOpens, clicks, whatsapp, ranking, weeks, sources }
}

// ─── Relatório do parceiro ───

const ROTA: GuideAction[] = ['waze', 'google_maps', 'link']

export async function getPartnerReport(propertyId: string, partnerId: string, range: ReportRange) {
  const rows = await prisma.$queryRaw<{ month: string; action: string; n: number }[]>(Prisma.sql`
    SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${AGENDA_TZ}, 'YYYY-MM') AS month, action, count(*)::int AS n
    FROM "GuideEvent"
    WHERE "propertyId" = ${propertyId} AND "partnerId" = ${partnerId}
      AND "createdAt" >= ${range.from} AND "createdAt" < ${range.to}
    GROUP BY 1, 2 ORDER BY 1`)

  const months = new Map<string, { month: string; whatsapp: number; ligar: number; rota: number; total: number }>()
  let opens = 0
  for (const r of rows) {
    const n = Number(r.n)
    const action = r.action as GuideAction
    if (action === 'abrir_card') {
      opens += n
      continue
    }
    if (!CONTACT_ACTIONS.includes(action)) continue
    const m = months.get(r.month) ?? { month: r.month, whatsapp: 0, ligar: 0, rota: 0, total: 0 }
    if (action === 'whatsapp') m.whatsapp += n
    else if (action === 'ligar') m.ligar += n
    else if (ROTA.includes(action)) m.rota += n
    m.total += n
    months.set(r.month, m)
  }

  const byMonth = [...months.values()].sort((a, b) => a.month.localeCompare(b.month))
  const totals = byMonth.reduce(
    (t, m) => ({ whatsapp: t.whatsapp + m.whatsapp, ligar: t.ligar + m.ligar, rota: t.rota + m.rota, total: t.total + m.total }),
    { whatsapp: 0, ligar: 0, rota: 0, total: 0 },
  )
  return { opens, byMonth, totals }
}

/** Parceiro ligado ao imóvel (o relatório só existe para esse par) */
export async function getPartnerForProperty(propertyId: string, partnerId: string) {
  const link = await prisma.propertyPartner.findUnique({
    where: { propertyId_partnerId: { propertyId, partnerId } },
    select: {
      property: { select: { id: true, name: true, active: true } },
      partner: { select: { id: true, name: true, category: true } },
    },
  })
  return link && link.property.active ? link : null
}

// ─── Link público somente leitura ───

function reportSecret() {
  return process.env.GUIDE_REPORT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || null
}

/** Token do link público do parceiro: HMAC de imóvel + parceiro (não expira; muda se o segredo mudar) */
export function partnerReportToken(propertyId: string, partnerId: string) {
  const secret = reportSecret()
  if (!secret) return null
  return createHmac('sha256', secret).update(`guia-parceiro:${propertyId}:${partnerId}`).digest('base64url').slice(0, 32)
}

export function verifyPartnerReportToken(propertyId: string, partnerId: string, token: string | undefined) {
  const expected = partnerReportToken(propertyId, partnerId)
  if (!expected || !token) return false
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
