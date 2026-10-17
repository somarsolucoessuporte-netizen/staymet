'use server'

import { refresh, revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentDbUser, canEditGuia } from '@/lib/guia-access'
import { PARTNER_CATEGORIES, PARTNER_CATEGORY_VALUES } from '@/lib/guia'

type ActionResult = { ok: true } | { ok: false; error: string }

async function assertAccess(propertyId: string) {
  const user = await getCurrentDbUser()
  if (!user || !(await canEditGuia(user, propertyId))) {
    throw new Error('Sem permissão para este imóvel.')
  }
  return user
}

function fail(error: unknown): ActionResult {
  return { ok: false, error: error instanceof Error ? error.message : 'Erro inesperado.' }
}

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))

/** Como optionalText, mas campo ausente (undefined) não é tocado no update */
const keepIfMissing = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === undefined ? undefined : v || null))

/** Após mudar botões: painel do anfitrião + guia público do imóvel */
function refreshGuia(propertyId: string) {
  revalidatePath(`/guia/${propertyId}`)
  refresh()
}

async function assertLinked(propertyId: string, partnerId: string) {
  const link = await prisma.propertyPartner.findUnique({
    where: { propertyId_partnerId: { propertyId, partnerId } },
  })
  if (!link) throw new Error('Botão não encontrado neste imóvel.')
}

/** Aceita só http(s); adiciona https:// se o anfitrião colar sem protocolo */
function normalizeUrl(raw: string | null) {
  if (!raw) return null
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(withProtocol)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

/** Monta https://wa.me/{numero}; números sem DDI (10–11 dígitos) recebem 55 */
function buildWhatsappUrl(raw: string | null) {
  if (!raw) return null
  let digits = raw.replace(/\D/g, '')
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`
  if (digits.length < 12 || digits.length > 15) return undefined
  return `https://wa.me/${digits}`
}

// ─── Leitura ───

export async function getGuiaConfig(propertyId: string) {
  await assertAccess(propertyId)

  const [property, latestReservation] = await Promise.all([
    prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true, name: true,
        wifiName: true, wifiPassword: true, deliveryInstructions: true,
        partners: {
          include: { partner: true },
          orderBy: [{ partner: { sortOrder: 'asc' } }, { partner: { name: 'asc' } }],
        },
      },
    }),
    prisma.reservation.findFirst({
      where: { propertyId, accessCode: { not: null }, status: { not: 'CANCELADA' } },
      orderBy: { checkIn: 'desc' },
      select: { accessCode: true },
    }),
  ])

  if (!property) return null

  const { partners, ...rest } = property
  return {
    property: rest,
    partners: partners.map((pp) => pp.partner),
    previewAccessCode: latestReservation?.accessCode ?? null,
  }
}

// ─── Wi-Fi e entregadores ───

const guiaSchema = z.object({
  wifiName: optionalText,
  wifiPassword: optionalText,
  deliveryInstructions: optionalText,
})

export async function updatePropertyGuia(
  propertyId: string,
  data: { wifiName?: string; wifiPassword?: string; deliveryInstructions?: string },
): Promise<ActionResult> {
  try {
    await assertAccess(propertyId)
    const parsed = guiaSchema.parse(data)
    await prisma.property.update({ where: { id: propertyId }, data: parsed })
    refresh()
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

// ─── Contatos e locais ───

const partnerSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Informe o nome.'),
  category: z.enum(PARTNER_CATEGORY_VALUES, { error: 'Categoria inválida.' }),
  // phone/description ausentes não apagam o valor salvo (o painel novo não edita telefone)
  phone: keepIfMissing,
  whatsapp: optionalText,
  externalUrl: optionalText,
  description: keepIfMissing,
})

export type PartnerInput = z.input<typeof partnerSchema>

export async function upsertPartner(propertyId: string, input: PartnerInput): Promise<ActionResult> {
  try {
    await assertAccess(propertyId)

    const parsed = partnerSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    const { id, whatsapp, externalUrl, ...fields } = parsed.data

    const whatsappUrl = buildWhatsappUrl(whatsapp)
    if (whatsappUrl === undefined) return { ok: false, error: 'WhatsApp inválido. Use DDD + número, ex: 85 99999-8888.' }
    const url = normalizeUrl(externalUrl)
    if (url === undefined) return { ok: false, error: 'Link externo inválido.' }

    const data = { ...fields, whatsappUrl, externalUrl: url }

    if (id) {
      // Só edita parceiros vinculados a este imóvel
      await assertLinked(propertyId, id)
      await prisma.partner.update({ where: { id }, data })
    } else {
      const last = await prisma.partner.aggregate({
        where: { properties: { some: { propertyId } } },
        _max: { sortOrder: true },
      })
      await prisma.partner.create({
        data: {
          ...data,
          sortOrder: (last._max.sortOrder ?? 0) + 1,
          properties: { create: { propertyId } },
        },
      })
    }

    refreshGuia(propertyId)
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function removePartner(propertyId: string, partnerId: string): Promise<ActionResult> {
  try {
    await assertAccess(propertyId)

    await prisma.$transaction(async (tx) => {
      await tx.propertyPartner.delete({
        where: { propertyId_partnerId: { propertyId, partnerId } },
      })
      const remaining = await tx.propertyPartner.count({ where: { partnerId } })
      if (remaining === 0) await tx.partner.delete({ where: { id: partnerId } })
    })

    refreshGuia(propertyId)
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

/**
 * Move o botão uma posição. O guia ordena por categoria e depois por sortOrder,
 * então a troca é feita com o vizinho da MESMA categoria (é o que muda a ordem que o hóspede vê).
 */
export async function reorderPartner(
  propertyId: string,
  partnerId: string,
  direction: 'up' | 'down',
): Promise<ActionResult> {
  try {
    await assertAccess(propertyId)
    await assertLinked(propertyId, partnerId)

    const current = await prisma.partner.findUnique({ where: { id: partnerId }, select: { category: true } })
    if (!current) return { ok: false, error: 'Botão não encontrado.' }

    const group = await prisma.partner.findMany({
      where: { category: current.category, properties: { some: { propertyId } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true },
    })
    const idx = group.findIndex((p) => p.id === partnerId)
    const target = direction === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || target < 0 || target >= group.length) return { ok: true }

    const ids = group.map((p) => p.id)
    ;[ids[idx], ids[target]] = [ids[target], ids[idx]]

    // Renumera o grupo inteiro (corrige sortOrder repetidos de dados antigos)
    const base = PARTNER_CATEGORIES.findIndex((c) => c.value === current.category) * 1000 + 1
    await prisma.$transaction(
      ids.map((id, i) => prisma.partner.update({ where: { id }, data: { sortOrder: base + i } })),
    )

    refreshGuia(propertyId)
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

/** Esconde/mostra o botão no guia sem apagar */
export async function togglePartnerActive(
  propertyId: string,
  partnerId: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    await assertAccess(propertyId)
    await assertLinked(propertyId, partnerId)
    await prisma.partner.update({ where: { id: partnerId }, data: { active } })
    refreshGuia(propertyId)
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}
