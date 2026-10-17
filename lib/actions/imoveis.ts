'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { PropertyType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentDbUser } from '@/lib/guia-access'
import { ensurePublicBucket } from '@/lib/supabase/admin'
import { COVER_BUCKET, COVER_MAX_BYTES, COVER_MIME_TYPES } from '@/lib/property-types'

type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string }

// ANFITRIAO e PROPRIETARIO só leem; criar/editar/desativar é da gestão
const MANAGER_ROLES = ['ADMINISTRADOR', 'GESTOR']

async function assertManager() {
  const user = await getCurrentDbUser()
  if (!user || !MANAGER_ROLES.includes(user.role)) throw new Error('Sem permissão para gerenciar imóveis.')
  return user
}

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : 'Erro inesperado.' }
}

function revalidateProperty(id?: string) {
  revalidatePath('/[locale]/admin/imoveis', 'page')
  revalidatePath('/[locale]/admin/dashboard', 'page')
  revalidatePath('/[locale]/anfitriao/guia', 'page')
  if (id) revalidatePath(`/guia/${id}`)
}

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))

const time = z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido (use HH:MM).')

const propertySchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do imóvel.').max(120),
  description: optionalText,
  type: z.enum(PropertyType, { error: 'Tipo de imóvel inválido.' }),
  ownerId: z.string().min(1, 'Selecione o proprietário.'),
  maxGuests: z.coerce.number().int('Hóspedes deve ser um número inteiro.').min(1, 'Mínimo de 1 hóspede.').max(100),
  address: z.string().trim().min(1, 'Informe o endereço.'),
  city: z.string().trim().min(1, 'Informe a cidade.'),
  state: z.string().trim().min(1, 'Informe o estado.').max(40),
  zipCode: optionalText,
  coverImageUrl: optionalText.refine(
    (v) => v === null || /^https?:\/\//i.test(v),
    'A foto de capa precisa ser um link http(s).',
  ),
  checkInTime: time,
  checkOutTime: time,
  rules: optionalText,
  wifiName: optionalText,
  wifiPassword: optionalText,
  deliveryInstructions: optionalText,
})

export type PropertyInput = z.input<typeof propertySchema>

async function parseInput(input: PropertyInput) {
  const parsed = propertySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' } as const

  const owner = await prisma.user.findUnique({ where: { id: parsed.data.ownerId }, select: { id: true } })
  if (!owner) return { error: 'Proprietário não encontrado.' } as const

  return { data: parsed.data } as const
}

export async function createProperty(input: PropertyInput): Promise<ActionResult<{ id: string }>> {
  try {
    await assertManager()
    const res = await parseInput(input)
    if ('error' in res) return { ok: false, error: res.error! }

    const property = await prisma.property.create({ data: res.data, select: { id: true } })
    revalidateProperty(property.id)
    return { ok: true, id: property.id }
  } catch (e) {
    return fail(e)
  }
}

export async function updateProperty(id: string, input: PropertyInput): Promise<ActionResult> {
  try {
    await assertManager()
    const res = await parseInput(input)
    if ('error' in res) return { ok: false, error: res.error! }

    await prisma.property.update({ where: { id }, data: res.data })
    revalidateProperty(id)
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

/** Soft delete: o imóvel tem reservas, tarefas e vistorias vinculadas */
export async function deactivateProperty(id: string): Promise<ActionResult> {
  try {
    await assertManager()
    await prisma.property.update({ where: { id }, data: { active: false } })
    revalidateProperty(id)
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function reactivateProperty(id: string): Promise<ActionResult> {
  try {
    await assertManager()
    await prisma.property.update({ where: { id }, data: { active: true } })
    revalidateProperty(id)
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

/**
 * Prepara o upload da foto de capa: valida, garante o bucket público e devolve uma URL assinada.
 * O arquivo vai direto do navegador para o Storage (limite de corpo da Vercel é ~4,5MB).
 */
export async function createCoverUploadUrl(file: {
  name: string
  type: string
  size: number
}): Promise<ActionResult<{ path: string; token: string; publicUrl: string }>> {
  try {
    await assertManager()
    if (!COVER_MIME_TYPES.includes(file.type)) return { ok: false, error: 'Use uma imagem JPG, PNG ou WEBP.' }
    if (file.size > COVER_MAX_BYTES) return { ok: false, error: 'A imagem deve ter no máximo 5MB.' }

    const admin = await ensurePublicBucket(COVER_BUCKET, {
      fileSizeLimit: COVER_MAX_BYTES,
      allowedMimeTypes: COVER_MIME_TYPES,
    })

    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type]
    const path = `capas/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`

    const { data, error } = await admin.storage.from(COVER_BUCKET).createSignedUploadUrl(path)
    if (error || !data) return { ok: false, error: `Não foi possível preparar o upload: ${error?.message ?? ''}` }

    const { data: pub } = admin.storage.from(COVER_BUCKET).getPublicUrl(path)
    return { ok: true, path: data.path, token: data.token, publicUrl: pub.publicUrl }
  } catch (e) {
    return fail(e)
  }
}
