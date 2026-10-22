'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { SUGGESTION_TOPICS, SUGGESTION_TITLE_PREFIX, SUGGESTIONS_PER_DAY, SUGGESTION_CATEGORY, REVIEW_TOPIC } from '@/lib/occurrences'
import { ensurePublicBucket } from '@/lib/supabase/admin'
import { COVER_MAX_BYTES, COVER_MIME_TYPES } from '@/lib/property-types'

type Result = { ok: true; id: string; createdAt: string; firstName: string } | { ok: false; error: string }

const schema = z
  .object({
    propertyId: z.string().min(1),
    topic: z.enum([...SUGGESTION_TOPICS, REVIEW_TOPIC], { error: 'Escolha sobre o que é a sugestão.' }),
    text: z.string().trim().max(1500, 'Máximo de 1.500 caracteres.'),
    photoUrl: z.string().url().optional().or(z.literal('')),
    consent: z.literal(true, { error: 'Para enviar, marque a autorização de compartilhamento.' }),
    // Avaliação: 1 a 5 estrelas, comentário opcional
    rating: z.number().int().min(1).max(5).optional(),
  })
  .refine((d) => (d.topic === REVIEW_TOPIC ? !!d.rating : true), { message: 'Escolha de 1 a 5 estrelas.', path: ['rating'] })
  .refine((d) => d.topic === REVIEW_TOPIC || d.text.length >= 10, { message: 'Escreva pelo menos 10 caracteres.', path: ['text'] })

/** Caixinha de sugestões do guia: exige sessão (Google ou link mágico); grava Occurrence SUGESTAO + evento CRIADA */
export async function submitSuggestion(input: z.input<typeof schema>): Promise<Result> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return { ok: false, error: 'Entre com sua conta para enviar a sugestão.' }

    const parsed = schema.safeParse(input)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    const { propertyId, topic, text, photoUrl, rating } = parsed.data
    const isReview = topic === REVIEW_TOPIC && !!rating

    const property = await prisma.property.findFirst({ where: { id: propertyId, active: true }, select: { suggestionsEnabled: true } })
    if (!property) return { ok: false, error: 'Imóvel não encontrado.' }
    if (!property.suggestionsEnabled) return { ok: false, error: 'A caixinha de sugestões está desativada neste imóvel.' }

    // Quem entrou por link mágico ainda não tem User: cria como HOSPEDE (mesma regra do login com Google)
    const meta = authUser.user_metadata ?? {}
    let user = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
    if (!user) {
      const sameEmail = await prisma.user.findUnique({ where: { email: authUser.email } })
      if (sameEmail) return { ok: false, error: 'Este e-mail já tem cadastro com outro acesso. Entre com a conta original.' }
      user = await prisma.user.create({
        data: {
          supabaseId: authUser.id,
          email: authUser.email,
          name: meta.full_name ?? meta.name ?? authUser.email.split('@')[0],
          avatarUrl: meta.avatar_url ?? meta.picture ?? null,
          role: 'HOSPEDE',
        },
      })
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const sentToday = await prisma.occurrence.count({
      where: { reportedById: user.id, category: SUGGESTION_CATEGORY, createdAt: { gte: since } },
    })
    if (sentToday >= SUGGESTIONS_PER_DAY) {
      return { ok: false, error: `Você já enviou ${SUGGESTIONS_PER_DAY} sugestões nas últimas 24 horas. Tente novamente amanhã.` }
    }

    // Reserva ativa deste e-mail no imóvel (se houver)
    const reservation = await prisma.reservation.findFirst({
      where: {
        propertyId,
        guestEmail: { equals: authUser.email, mode: 'insensitive' },
        status: { in: ['CONFIRMADA', 'EM_ANDAMENTO'] },
      },
      orderBy: { checkIn: 'desc' },
      select: { id: true, guestPhone: true },
    })

    const created = await prisma.$transaction(async (tx) => {
      const occ = await tx.occurrence.create({
        data: {
          propertyId,
          title: isReview ? `${SUGGESTION_TITLE_PREFIX}${REVIEW_TOPIC} ${'★'.repeat(rating!)}${'☆'.repeat(5 - rating!)} (${rating}/5)` : `${SUGGESTION_TITLE_PREFIX}${topic}`,
          description: text || 'Sem comentário.',
          photos: photoUrl ? [photoUrl] : [],
          category: SUGGESTION_CATEGORY,
          source: 'HOSPEDE',
          priority: isReview && rating! <= 2 ? 'MEDIA' : 'BAIXA',
          status: 'ABERTA',
          reportedById: user.id,
          reporterName: user.name,
          reporterContact: [user.email, user.phone ?? reservation?.guestPhone].filter(Boolean).join(' · '),
          reservationId: reservation?.id ?? null,
        },
        select: { id: true, createdAt: true },
      })
      await tx.occurrenceEvent.create({
        data: {
          occurrenceId: occ.id, type: 'CRIADA', toValue: 'Nova', message: isReview ? `${REVIEW_TOPIC} ${rating}/5` : topic,
          actorId: user.id, actorLabel: `Hóspede – ${user.name}`,
        },
      })
      return occ
    })

    return { ok: true, id: created.id, createdAt: created.createdAt.toISOString(), firstName: user.name.split(' ')[0] }
  } catch {
    return { ok: false, error: 'Não foi possível enviar agora. Tente novamente em instantes.' }
  }
}

/** Foto opcional da sugestão: URL assinada para upload direto (basta estar conectado) */
export async function createSuggestionPhotoUploadUrl(file: { type: string; size: number }): Promise<
  { ok: true; path: string; token: string; publicUrl: string; bucket: string } | { ok: false; error: string }
> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Entre com sua conta para enviar foto.' }
    if (!COVER_MIME_TYPES.includes(file.type)) return { ok: false, error: 'Use uma imagem JPG, PNG ou WEBP.' }
    if (file.size > COVER_MAX_BYTES) return { ok: false, error: 'A imagem deve ter no máximo 5MB.' }

    const bucket = 'ocorrencias'
    const admin = await ensurePublicBucket(bucket, { fileSizeLimit: COVER_MAX_BYTES, allowedMimeTypes: COVER_MIME_TYPES })
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type]
    const path = `sugestoes/${user.id}/${Date.now()}.${ext}`
    const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(path)
    if (error || !data) return { ok: false, error: 'Não foi possível preparar o upload.' }
    const { data: pub } = admin.storage.from(bucket).getPublicUrl(path)
    return { ok: true, path: data.path, token: data.token, publicUrl: pub.publicUrl, bucket }
  } catch {
    return { ok: false, error: 'Não foi possível preparar o upload.' }
  }
}
