'use server'

import { refresh } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentDbUser } from '@/lib/guia-access'
import { canManageAgenda, getConflicts, serializeBooking } from '@/lib/agenda-server'
import { bookingLabel, bookingRange, isISODate, isoToDate, MANUAL_SOURCES, nightsBetween, PLATFORM_META, todayISO } from '@/lib/agenda'
import { syncChannel, syncProperty, validateImportUrl } from '@/lib/ical-sync'

type ActionResult = { ok: true } | { ok: false; error: string }

async function assertAccess(propertyId: string) {
  const user = await getCurrentDbUser()
  if (!user || !(await canManageAgenda(user, propertyId))) {
    throw new Error('Sem permissão para este imóvel.')
  }
  return user
}

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : 'Erro inesperado.' }
}

const conflictCount = async (propertyId: string) => (await getConflicts([propertyId])).length

// ─── Sincronização ───

export type SyncNowResult =
  | { ok: true; channels: number; errors: string[]; conflicts: number }
  | { ok: false; error: string }

/** Botão "Sincronizar agora": só os canais deste imóvel */
export async function syncPropertyNow(propertyId: string): Promise<SyncNowResult> {
  try {
    await assertAccess(propertyId)
    const results = await syncProperty(propertyId)
    refresh()
    return {
      ok: true,
      channels: results.length,
      errors: results.flatMap((r) => (r.ok ? [] : [r.error])),
      conflicts: await conflictCount(propertyId),
    }
  } catch (e) {
    return fail(e)
  }
}

// ─── Lançamento manual ───

const optionalText = z.string().trim().max(500).optional().transform((v) => v || null)

const manualSchema = z
  .object({
    kind: z.enum(['RESERVA', 'BLOQUEIO']),
    source: z.enum(MANUAL_SOURCES).optional(),
    startDate: z.string().refine(isISODate, 'Data de entrada inválida.'),
    endDate: z.string().refine(isISODate, 'Data de saída inválida.'),
    guestName: optionalText,
    guestContact: optionalText,
    guestsCount: z.coerce.number().int().min(1, 'Hóspedes: mínimo 1.').max(50).optional().nullable(),
    amount: optionalText,
    notes: optionalText,
  })
  .refine((v) => v.endDate > v.startDate, { message: 'A saída precisa ser depois da entrada.' })
  .refine((v) => nightsBetween(v.startDate, v.endDate) <= 365, { message: 'Período longo demais (máx. 1 ano).' })
  .refine((v) => v.kind === 'BLOQUEIO' || !!v.guestName, { message: 'Informe o nome do hóspede.' })

export type ManualBookingInput = z.input<typeof manualSchema>

export type ManualBookingResult =
  | { ok: true; conflicts: number }
  | { ok: false; error: string; overlaps?: string[] }

/** "1.234,56", "1234,56" ou "1234.56" → número */
function parseAmount(raw: string | null) {
  if (!raw) return null
  const s = raw.replace(/[^\d,.-]/g, '')
  const n = Number(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s)
  if (!Number.isFinite(n) || n < 0) throw new Error('Valor inválido.')
  return n
}

/**
 * Reserva direta/OLX/outro ou bloqueio de datas. Se sobrepor algo confirmado, devolve a lista
 * e só grava quando o anfitrião confirmar (confirmOverlap = true).
 */
export async function createManualBooking(
  propertyId: string,
  input: ManualBookingInput,
  confirmOverlap = false,
): Promise<ManualBookingResult> {
  try {
    const user = await assertAccess(propertyId)
    const parsed = manualSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    const v = parsed.data
    const amount = parseAmount(v.amount)

    const start = isoToDate(v.startDate)
    const end = isoToDate(v.endDate)
    if (!confirmOverlap) {
      const clash = await prisma.booking.findMany({
        where: { propertyId, status: 'CONFIRMADA', startDate: { lt: end }, endDate: { gt: start } },
        include: { channel: { select: { platform: true } } },
        orderBy: { startDate: 'asc' },
      })
      if (clash.length) {
        return {
          ok: false,
          error: 'Essas datas já estão ocupadas.',
          overlaps: clash.map(serializeBooking).map((b) => `${bookingLabel(b)} · ${bookingRange(b)}`),
        }
      }
    }

    const isBlock = v.kind === 'BLOQUEIO'
    await prisma.booking.create({
      data: {
        propertyId,
        source: isBlock ? 'BLOQUEIO' : v.source ?? 'DIRETO',
        startDate: start,
        endDate: end,
        guestName: isBlock ? null : v.guestName,
        guestContact: isBlock ? null : v.guestContact,
        guestsCount: isBlock ? null : v.guestsCount ?? null,
        amount: isBlock ? null : amount,
        notes: v.notes,
        createdById: user.id,
      },
    })

    refresh()
    return { ok: true, conflicts: await conflictCount(propertyId) }
  } catch (e) {
    return fail(e)
  }
}

/** Cancela reserva/bloqueio lançado no Staymet (os dos canais seguem o feed da plataforma) */
export async function cancelManualBooking(propertyId: string, bookingId: string): Promise<ActionResult> {
  try {
    await assertAccess(propertyId)
    const res = await prisma.booking.updateMany({
      where: { id: bookingId, propertyId, channelId: null, status: 'CONFIRMADA' },
      data: { status: 'CANCELADA' },
    })
    if (res.count === 0) return { ok: false, error: 'Reserva não encontrada.' }
    refresh()
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

// ─── Canais ───

const channelSchema = z.object({
  platform: z.enum(['AIRBNB', 'BOOKING', 'VRBO', 'OUTRO'], { error: 'Escolha a plataforma.' }),
  label: z.string().trim().max(60).optional(),
  importUrl: z.string().trim().min(1, 'Cole o link de exportação da plataforma.'),
})

export type AddChannelResult =
  | { ok: true; synced: boolean; syncError?: string; events: number; conflicts: number }
  | { ok: false; error: string }

/** Conecta um canal pelo link de exportação (.ics) e já faz a primeira sincronização */
export async function addChannel(propertyId: string, input: z.input<typeof channelSchema>): Promise<AddChannelResult> {
  try {
    await assertAccess(propertyId)
    const parsed = channelSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    const { platform, label, importUrl } = parsed.data
    const url = validateImportUrl(importUrl).toString()

    const dup = await prisma.calendarChannel.findFirst({ where: { propertyId, importUrl: url }, select: { id: true } })
    if (dup) return { ok: false, error: 'Esse link já está conectado a este imóvel.' }

    const channel = await prisma.calendarChannel.create({
      data: { propertyId, platform, label: label || PLATFORM_META[platform].label, importUrl: url },
    })
    const result = await syncChannel(channel.id)

    refresh()
    return {
      ok: true,
      synced: result.ok,
      syncError: result.ok ? undefined : result.error,
      events: result.ok ? result.events : 0,
      conflicts: await conflictCount(propertyId),
    }
  } catch (e) {
    return fail(e)
  }
}

/** Desconecta o canal: as reservas futuras dele viram CANCELADA (histórico fica) */
export async function removeChannel(propertyId: string, channelId: string): Promise<ActionResult> {
  try {
    await assertAccess(propertyId)
    const channel = await prisma.calendarChannel.findFirst({ where: { id: channelId, propertyId }, select: { id: true } })
    if (!channel) return { ok: false, error: 'Canal não encontrado.' }

    await prisma.$transaction([
      prisma.booking.updateMany({
        where: { channelId, status: 'CONFIRMADA', endDate: { gt: isoToDate(todayISO()) } },
        data: { status: 'CANCELADA' },
      }),
      prisma.calendarChannel.delete({ where: { id: channelId } }),
    ])

    refresh()
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}
