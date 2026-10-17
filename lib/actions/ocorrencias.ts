'use server'

import { refresh } from 'next/cache'
import { z } from 'zod'
import type { OccurrenceStatus, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentDbUser } from '@/lib/guia-access'
import { ensurePublicBucket } from '@/lib/supabase/admin'
import {
  canManageProperty, canContributeProperty, sourceForRole, actorLabel, type DbUser,
} from '@/lib/occurrence-access'
import {
  OPERATIONAL_CATEGORY_VALUES, SUGGESTION_CATEGORY, STATUS_LABEL, categoryLabel, PRIORITIES,
} from '@/lib/occurrences'
import { COVER_MAX_BYTES, COVER_MIME_TYPES } from '@/lib/property-types'

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }

function fail(e: unknown): { ok: false; error: string } {
  return { ok: false, error: e instanceof Error ? e.message : 'Erro inesperado.' }
}

async function requireUser() {
  const user = await getCurrentDbUser()
  if (!user) throw new Error('Faça login para continuar.')
  return user
}

/** Carrega a ocorrência e confere a permissão pedida */
async function loadOccurrence(id: string, user: DbUser, need: 'manage' | 'contribute') {
  const occ = await prisma.occurrence.findUnique({
    where: { id },
    select: {
      id: true, propertyId: true, status: true, priority: true, category: true, title: true,
      description: true, archivedAt: true, assignedToId: true, photos: true, source: true,
      reporterName: true, reporterContact: true, reportedById: true, reservationId: true,
    },
  })
  if (!occ) throw new Error('Ocorrência não encontrada.')
  const allowed = need === 'manage' ? await canManageProperty(user, occ.propertyId) : await canContributeProperty(user, occ.propertyId)
  if (!allowed) throw new Error('Sem permissão para esta ocorrência.')
  return occ
}

function event(user: DbUser, occurrenceId: string, data: Omit<Prisma.OccurrenceEventUncheckedCreateInput, 'occurrenceId' | 'actorId' | 'actorLabel'>) {
  return prisma.occurrenceEvent.create({
    data: { ...data, occurrenceId, actorId: user.id, actorLabel: actorLabel(user) },
  })
}

const priorityEnum = z.enum(PRIORITIES.map((p) => p.value) as ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'])
const photosSchema = z.array(z.string().url()).max(6).default([])

// ─── Criar ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  propertyId: z.string().min(1, 'Selecione o imóvel.'),
  title: z.string().trim().min(3, 'Título muito curto.').max(120),
  description: z.string().trim().min(5, 'Descreva o problema.').max(4000),
  category: z.enum(OPERATIONAL_CATEGORY_VALUES, { error: 'Categoria inválida.' }),
  priority: priorityEnum.default('MEDIA'),
  photos: photosSchema,
})

export async function createOccurrence(input: z.input<typeof createSchema>): Promise<Result<{ id: string }>> {
  try {
    const user = await requireUser()
    const parsed = createSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    if (!(await canContributeProperty(user, parsed.data.propertyId))) return { ok: false, error: 'Sem permissão para este imóvel.' }

    const occ = await prisma.$transaction(async (tx) => {
      const created = await tx.occurrence.create({
        data: {
          ...parsed.data,
          source: sourceForRole(user.role),
          reportedById: user.id,
          reporterName: user.name,
          reporterContact: user.phone ?? user.email,
        },
        select: { id: true },
      })
      await tx.occurrenceEvent.create({
        data: {
          occurrenceId: created.id, type: 'CRIADA', toValue: 'ABERTA',
          message: `${categoryLabel(parsed.data.category)} · prioridade ${parsed.data.priority.toLowerCase()}`,
          actorId: user.id, actorLabel: actorLabel(user),
        },
      })
      return created
    })
    refresh()
    return { ok: true, id: occ.id }
  } catch (e) {
    return fail(e)
  }
}

// ─── Editar campos ──────────────────────────────────────────────────────────

const updateSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(5).max(4000),
  category: z.string(),
  photos: photosSchema,
})

export async function updateOccurrence(id: string, input: z.input<typeof updateSchema>): Promise<Result> {
  try {
    const user = await requireUser()
    const occ = await loadOccurrence(id, user, 'manage')
    const parsed = updateSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

    // Sugestão continua sugestão; operacional só aceita categorias operacionais
    const isSuggestion = occ.category === SUGGESTION_CATEGORY
    const category = isSuggestion ? SUGGESTION_CATEGORY : parsed.data.category
    if (!isSuggestion && !(OPERATIONAL_CATEGORY_VALUES as readonly string[]).includes(category)) {
      return { ok: false, error: 'Categoria inválida.' }
    }

    const changed: string[] = []
    if (parsed.data.title !== occ.title) changed.push('título')
    if (parsed.data.description !== occ.description) changed.push('descrição')
    if (category !== occ.category) changed.push(`categoria (${categoryLabel(occ.category)} → ${categoryLabel(category)})`)
    if (JSON.stringify(parsed.data.photos) !== JSON.stringify(occ.photos)) changed.push('fotos')
    if (changed.length === 0) return { ok: true }

    await prisma.$transaction([
      prisma.occurrence.update({ where: { id }, data: { ...parsed.data, category } }),
      event(user, id, { type: 'EDITADA', message: `Alterou ${changed.join(', ')}` }),
    ])
    refresh()
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

// ─── Status / prioridade / responsável ──────────────────────────────────────

export async function changeStatus(id: string, status: 'ABERTA' | 'EM_ANDAMENTO'): Promise<Result> {
  try {
    const user = await requireUser()
    const occ = await loadOccurrence(id, user, 'manage')
    if (!['ABERTA', 'EM_ANDAMENTO'].includes(status)) return { ok: false, error: 'Use "Resolver" para concluir.' }
    if (occ.status === status) return { ok: true }

    const reopening = occ.status === 'RESOLVIDA'
    await prisma.$transaction([
      prisma.occurrence.update({
        where: { id },
        data: { status, ...(reopening ? { resolvedAt: null } : {}) },
      }),
      event(user, id, {
        type: reopening ? 'REABERTA' : 'STATUS',
        fromValue: STATUS_LABEL[occ.status], toValue: STATUS_LABEL[status],
      }),
    ])
    refresh()
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function changePriority(id: string, priority: z.infer<typeof priorityEnum>): Promise<Result> {
  try {
    const user = await requireUser()
    const occ = await loadOccurrence(id, user, 'manage')
    const p = priorityEnum.parse(priority)
    if (occ.priority === p) return { ok: true }
    const label = (v: string) => PRIORITIES.find((x) => x.value === v)?.label ?? v
    await prisma.$transaction([
      prisma.occurrence.update({ where: { id }, data: { priority: p } }),
      event(user, id, { type: 'PRIORIDADE', fromValue: label(occ.priority), toValue: label(p) }),
    ])
    refresh()
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function assignOccurrence(id: string, assigneeId: string | null): Promise<Result> {
  try {
    const user = await requireUser()
    const occ = await loadOccurrence(id, user, 'manage')
    if ((occ.assignedToId ?? null) === (assigneeId || null)) return { ok: true }

    const [prev, next] = await Promise.all([
      occ.assignedToId ? prisma.user.findUnique({ where: { id: occ.assignedToId }, select: { name: true } }) : null,
      assigneeId ? prisma.user.findUnique({ where: { id: assigneeId }, select: { name: true } }) : null,
    ])
    if (assigneeId && !next) return { ok: false, error: 'Responsável não encontrado.' }

    await prisma.$transaction([
      prisma.occurrence.update({ where: { id }, data: { assignedToId: assigneeId || null } }),
      event(user, id, { type: 'ATRIBUIDA', fromValue: prev?.name ?? 'Ninguém', toValue: next?.name ?? 'Ninguém' }),
    ])
    refresh()
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

// ─── Comentário / resolver / arquivar / excluir ─────────────────────────────

export async function addComment(id: string, message: string): Promise<Result> {
  try {
    const user = await requireUser()
    await loadOccurrence(id, user, 'contribute')
    const text = z.string().trim().min(1, 'Escreva o comentário.').max(2000).parse(message)
    await event(user, id, { type: 'COMENTARIO', message: text })
    await prisma.occurrence.update({ where: { id }, data: { updatedAt: new Date() } })
    refresh()
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function resolveOccurrence(id: string, resolution: string): Promise<Result> {
  try {
    const user = await requireUser()
    const occ = await loadOccurrence(id, user, 'manage')
    const text = z.string().trim().min(3, 'Descreva a solução.').max(4000).parse(resolution)
    await prisma.$transaction([
      prisma.occurrence.update({ where: { id }, data: { status: 'RESOLVIDA', resolution: text, resolvedAt: new Date() } }),
      event(user, id, { type: 'RESOLVIDA', fromValue: STATUS_LABEL[occ.status], toValue: 'Resolvida', message: text }),
    ])
    refresh()
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function archiveOccurrence(id: string): Promise<Result> {
  try {
    const user = await requireUser()
    const occ = await loadOccurrence(id, user, 'manage')
    if (occ.archivedAt) return { ok: true }
    await prisma.$transaction([
      prisma.occurrence.update({ where: { id }, data: { archivedAt: new Date() } }),
      event(user, id, { type: 'ARQUIVADA' }),
    ])
    refresh()
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function unarchiveOccurrence(id: string): Promise<Result> {
  try {
    const user = await requireUser()
    const occ = await loadOccurrence(id, user, 'manage')
    if (!occ.archivedAt) return { ok: true }
    await prisma.$transaction([
      prisma.occurrence.update({ where: { id }, data: { archivedAt: null } }),
      event(user, id, { type: 'REABERTA', message: 'Desarquivada' }),
    ])
    refresh()
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

/** Exclusão definitiva — só ADMINISTRADOR (eventos saem junto, por cascade) */
export async function deleteOccurrence(id: string): Promise<Result> {
  try {
    const user = await requireUser()
    if (user.role !== 'ADMINISTRADOR') return { ok: false, error: 'Só o administrador pode excluir.' }
    await prisma.occurrence.delete({ where: { id } })
    refresh()
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

// ─── Sugestões (painel) ─────────────────────────────────────────────────────

const SUGGESTION_STATUS: Record<'lida' | 'respondida', OccurrenceStatus> = { lida: 'EM_ANDAMENTO', respondida: 'RESOLVIDA' }

export async function markSuggestion(id: string, as: 'lida' | 'respondida', channel?: 'WhatsApp' | 'e-mail'): Promise<Result> {
  try {
    const user = await requireUser()
    const occ = await loadOccurrence(id, user, 'manage')
    if (occ.category !== SUGGESTION_CATEGORY) return { ok: false, error: 'Não é uma sugestão.' }
    const status = SUGGESTION_STATUS[as]
    if (occ.status === status) return { ok: true }
    const label = (s: string) => ({ ABERTA: 'Nova', EM_ANDAMENTO: 'Lida', RESOLVIDA: 'Respondida' })[s] ?? s
    await prisma.$transaction([
      prisma.occurrence.update({
        where: { id },
        data: { status, ...(status === 'RESOLVIDA' ? { resolvedAt: new Date() } : {}) },
      }),
      event(user, id, {
        type: 'STATUS', fromValue: label(occ.status), toValue: label(status),
        message: channel ? `Respondida por ${channel}` : undefined,
      }),
    ])
    refresh()
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

/** Cria uma ocorrência operacional ligada à sugestão, com evento no histórico das duas */
export async function convertSuggestion(id: string): Promise<Result<{ id: string }>> {
  try {
    const user = await requireUser()
    const sug = await loadOccurrence(id, user, 'manage')
    if (sug.category !== SUGGESTION_CATEGORY) return { ok: false, error: 'Não é uma sugestão.' }

    const created = await prisma.$transaction(async (tx) => {
      const occ = await tx.occurrence.create({
        data: {
          propertyId: sug.propertyId,
          title: sug.title.replace(/^Sugestão – /, ''),
          description: sug.description,
          photos: sug.photos,
          category: 'OPERACIONAL',
          priority: 'MEDIA',
          source: sourceForRole(user.role),
          reportedById: user.id,
          reporterName: user.name,
          reservationId: sug.reservationId,
          convertedFromId: sug.id,
        },
        select: { id: true },
      })
      const label = actorLabel(user)
      await tx.occurrenceEvent.createMany({
        data: [
          { occurrenceId: occ.id, type: 'CRIADA', toValue: 'ABERTA', message: `Criada a partir da sugestão de ${sug.reporterName ?? 'hóspede'}`, actorId: user.id, actorLabel: label },
          { occurrenceId: sug.id, type: 'CONVERTIDA', toValue: occ.id, message: 'Convertida em ocorrência operacional', actorId: user.id, actorLabel: label },
        ],
      })
      if (sug.status === 'ABERTA') await tx.occurrence.update({ where: { id: sug.id }, data: { status: 'EM_ANDAMENTO' } })
      return occ
    })
    refresh()
    return { ok: true, id: created.id }
  } catch (e) {
    return fail(e)
  }
}

// ─── Fotos ──────────────────────────────────────────────────────────────────

const PHOTO_BUCKET = 'ocorrencias'

/** URL assinada para enviar foto direto ao Storage (qualquer usuário logado) */
export async function createOccurrencePhotoUploadUrl(file: { type: string; size: number }): Promise<Result<{ path: string; token: string; publicUrl: string; bucket: string }>> {
  try {
    await requireUser()
    if (!COVER_MIME_TYPES.includes(file.type)) return { ok: false, error: 'Use uma imagem JPG, PNG ou WEBP.' }
    if (file.size > COVER_MAX_BYTES) return { ok: false, error: 'A imagem deve ter no máximo 5MB.' }
    const admin = await ensurePublicBucket(PHOTO_BUCKET, { fileSizeLimit: COVER_MAX_BYTES, allowedMimeTypes: COVER_MIME_TYPES })
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type]
    const path = `fotos/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`
    const { data, error } = await admin.storage.from(PHOTO_BUCKET).createSignedUploadUrl(path)
    if (error || !data) return { ok: false, error: 'Não foi possível preparar o upload.' }
    const { data: pub } = admin.storage.from(PHOTO_BUCKET).getPublicUrl(path)
    return { ok: true, path: data.path, token: data.token, publicUrl: pub.publicUrl, bucket: PHOTO_BUCKET }
  } catch (e) {
    return fail(e)
  }
}
