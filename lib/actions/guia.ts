'use server'

import { refresh, revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentDbUser, canEditGuia } from '@/lib/guia-access'
import { ensurePublicBucket } from '@/lib/supabase/admin'
import { COVER_BUCKET, COVER_MAX_BYTES, COVER_MIME_TYPES } from '@/lib/property-types'
import { slugify } from '@/lib/slug'
import { isGoogleMapsHost, isValidLatLng, parseLatLngFromText, type LatLng } from '@/lib/geo'
import { PARTNER_CATEGORY_VALUES } from '@/lib/guia'

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
        wifiName: true, wifiPassword: true, deliveryInstructions: true, suggestionsEnabled: true,
        slug: true, locationUrl: true, coverImageUrl: true, city: true, state: true, address: true,
        latitude: true, longitude: true,
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

// ─── Link do guia (slug), foto de capa e localização ───

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Define o link amigável /g/{slug}. Vazio remove o slug (vale o link /guia/{id}). */
export async function updateGuiaSlug(propertyId: string, raw: string): Promise<ActionResult> {
  try {
    await assertAccess(propertyId)
    const slug = slugify(raw)
    if (!slug) {
      await prisma.property.update({ where: { id: propertyId }, data: { slug: null } })
      refreshGuia(propertyId)
      return { ok: true }
    }
    if (slug.length < 3 || slug.length > 60 || !SLUG_RE.test(slug)) {
      return { ok: false, error: 'Use de 3 a 60 letras, números ou hífens.' }
    }
    const taken = await prisma.property.findFirst({ where: { slug, NOT: { id: propertyId } }, select: { id: true } })
    if (taken) return { ok: false, error: 'Este link já está em uso por outro imóvel. Tente outro.' }
    await prisma.property.update({ where: { id: propertyId }, data: { slug } })
    refreshGuia(propertyId)
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

/** Foto de capa e localização (link do Google Maps) do guia */
export async function updateGuiaPlace(
  propertyId: string,
  data: { coverImageUrl?: string; locationUrl?: string },
): Promise<ActionResult> {
  try {
    await assertAccess(propertyId)
    const patch: { coverImageUrl?: string | null; locationUrl?: string | null } = {}
    if (data.coverImageUrl !== undefined) {
      const url = normalizeUrl(data.coverImageUrl.trim() || null)
      if (url === undefined) return { ok: false, error: 'Link da foto inválido.' }
      patch.coverImageUrl = url
    }
    if (data.locationUrl !== undefined) {
      const url = normalizeUrl(data.locationUrl.trim() || null)
      if (url === undefined) return { ok: false, error: 'Link do mapa inválido.' }
      patch.locationUrl = url
    }
    await prisma.property.update({ where: { id: propertyId }, data: patch })
    refreshGuia(propertyId)
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

/** URL assinada para o anfitrião enviar a foto de capa direto ao Storage */
export async function createGuiaCoverUploadUrl(
  propertyId: string,
  file: { type: string; size: number },
): Promise<{ ok: true; path: string; token: string; publicUrl: string } | { ok: false; error: string }> {
  try {
    await assertAccess(propertyId)
    if (!COVER_MIME_TYPES.includes(file.type)) return { ok: false, error: 'Use uma imagem JPG, PNG ou WEBP.' }
    if (file.size > COVER_MAX_BYTES) return { ok: false, error: 'A imagem deve ter no máximo 5MB.' }
    const admin = await ensurePublicBucket(COVER_BUCKET, { fileSizeLimit: COVER_MAX_BYTES, allowedMimeTypes: COVER_MIME_TYPES })
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type]
    const path = `capas/${propertyId}-${Date.now()}.${ext}`
    const { data, error } = await admin.storage.from(COVER_BUCKET).createSignedUploadUrl(path)
    if (error || !data) return { ok: false, error: 'Não foi possível preparar o upload.' }
    const { data: pub } = admin.storage.from(COVER_BUCKET).getPublicUrl(path)
    return { ok: true, path: data.path, token: data.token, publicUrl: pub.publicUrl }
  } catch (e) {
    const r = fail(e)
    return { ok: false, error: r.ok ? '' : r.error }
  }
}

/** Mostra/esconde a caixinha de sugestões no guia do hóspede */
export async function setSuggestionsEnabled(propertyId: string, enabled: boolean): Promise<ActionResult> {
  try {
    await assertAccess(propertyId)
    await prisma.property.update({ where: { id: propertyId }, data: { suggestionsEnabled: enabled } })
    refreshGuia(propertyId)
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
  deliveryNote: keepIfMissing,
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
 * Salva a ordem dos botões arrastados no painel (um grupo por vez: Contatos ou Dicas).
 * O guia ordena só por sortOrder, então a posição aqui é a que o hóspede vê.
 */
export async function reorderPartners(propertyId: string, orderedIds: string[]): Promise<ActionResult> {
  try {
    await assertAccess(propertyId)

    const ids = z.array(z.string().min(1)).min(1).max(500).parse(orderedIds)
    if (new Set(ids).size !== ids.length) return { ok: false, error: 'Lista de botões repetida.' }

    const linked = await prisma.propertyPartner.count({ where: { propertyId, partnerId: { in: ids } } })
    if (linked !== ids.length) return { ok: false, error: 'Botão não encontrado neste imóvel.' }

    await prisma.$transaction(
      ids.map((id, i) => prisma.partner.update({ where: { id }, data: { sortOrder: i + 1 } })),
    )

    const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { slug: true } })
    if (property?.slug) revalidatePath(`/g/${property.slug}`)
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

// ─── Localização exata da casa ───

/** Salva (ou remove, com null) o ponto da casa. O link colado, se houver, vira o locationUrl de reserva. */
export async function updateGuiaLocation(
  propertyId: string,
  point: LatLng | null,
  sourceUrl?: string | null,
): Promise<ActionResult> {
  try {
    await assertAccess(propertyId)
    if (point && !isValidLatLng(point.lat, point.lng)) return { ok: false, error: 'Coordenadas inválidas.' }
    const data: { latitude: number | null; longitude: number | null; locationUrl?: string | null } = {
      latitude: point ? Math.round(point.lat * 1e7) / 1e7 : null,
      longitude: point ? Math.round(point.lng * 1e7) / 1e7 : null,
    }
    if (sourceUrl !== undefined) {
      const url = normalizeUrl(sourceUrl?.trim() || null)
      if (url !== undefined) data.locationUrl = url
    }
    await prisma.property.update({ where: { id: propertyId }, data })
    refreshGuia(propertyId)
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

/**
 * Lê lat/lng de um link do Google Maps. Links curtos (maps.app.goo.gl) são resolvidos aqui no servidor,
 * seguindo os redirecionamentos só enquanto o destino for do Google.
 */
export async function resolveMapsLink(
  propertyId: string,
  link: string,
): Promise<{ ok: true; point: LatLng } | { ok: false; error: string }> {
  try {
    await assertAccess(propertyId)
    const direct = parseLatLngFromText(link)
    if (direct) return { ok: true, point: direct }

    let url: URL
    try {
      url = new URL(link.trim())
    } catch {
      return { ok: false, error: 'Cole um link do Google Maps (ou "latitude, longitude").' }
    }
    if (!isGoogleMapsHost(url.hostname)) return { ok: false, error: 'Esse link não é do Google Maps.' }

    for (let hop = 0; hop < 6; hop++) {
      const res = await fetch(url, {
        redirect: 'manual',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Staymet/1.0)' },
        signal: AbortSignal.timeout(6000),
        cache: 'no-store',
      })
      const location = res.headers.get('location')
      if (res.status >= 300 && res.status < 400 && location) {
        url = new URL(location, url)
        if (!isGoogleMapsHost(url.hostname)) break
        const found = parseLatLngFromText(url.toString())
        if (found) return { ok: true, point: found }
        continue
      }
      // Página final: às vezes as coordenadas só aparecem no HTML
      if (res.ok) {
        const html = (await res.text()).slice(0, 400_000)
        const found = parseLatLngFromText(url.toString()) ?? parseLatLngFromText(html.match(/https:\/\/www\.google\.[^"'\s]*@-?\d[^"'\s]*/)?.[0] ?? '')
        if (found) return { ok: true, point: found }
      }
      break
    }
    return { ok: false, error: 'Não achei as coordenadas nesse link. Marque o ponto no mapa ou use sua localização atual.' }
  } catch (e) {
    if (e instanceof Error && e.name === 'TimeoutError') return { ok: false, error: 'O Google Maps demorou a responder. Tente de novo.' }
    return fail(e) as { ok: false; error: string }
  }
}
