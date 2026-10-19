import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Phone, Mail, Link2 } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getCurrentDbUser } from '@/lib/guia-access'
import { occurrenceScope, canManageProperty } from '@/lib/occurrence-access'
import {
  PRIORITIES, STATUS_LABEL, SUGGESTION_CATEGORY, SUGGESTION_TITLE_PREFIX, EVENT_LABEL,
  categoryLabel, suggestionStatusLabel, formatDateTimeBR, timeAgo,
} from '@/lib/occurrences'
import { OriginBadge } from '@/components/shared/OriginBadge'
import { OccurrenceCategoryIcon } from '@/components/ocorrencias/OccurrenceCategoryIcon'
import { OccurrenceControls } from '@/components/ocorrencias/OccurrenceControls'
import { cn, formatFirstName } from '@/lib/utils'

const EVENT_DOT: Record<string, string> = {
  CRIADA: 'bg-[#1A56DB]', RESOLVIDA: 'bg-emerald-500', ARQUIVADA: 'bg-gray-400', REABERTA: 'bg-amber-500',
  COMENTARIO: 'bg-sky-400', CONVERTIDA: 'bg-violet-500',
}

/** Detalhe da ocorrência/sugestão com linha do tempo — mesma tela para admin, gestor e anfitrião */
export async function OccurrenceDetailView({ id, basePath }: { id: string; basePath: string }) {
  const user = await getCurrentDbUser()
  const scope = user ? occurrenceScope(user) : null
  if (!user || scope === null) notFound()

  const occ = await prisma.occurrence.findFirst({
    where: { AND: [{ id }, scope] },
    include: {
      property: { select: { id: true, name: true } },
      reportedBy: { select: { name: true, email: true, phone: true, avatarUrl: true } },
      assignedTo: { select: { name: true } },
      reservation: { select: { guestName: true, guestPhone: true, guestEmail: true, checkIn: true, checkOut: true } },
      convertedFrom: { select: { id: true, title: true } },
      conversions: { select: { id: true, title: true } },
      events: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!occ) notFound()

  const canManage = await canManageProperty(user, occ.propertyId)
  const assignees = canManage
    ? await prisma.user.findMany({
        where: {
          OR: [
            { role: { in: ['ADMINISTRADOR', 'GESTOR'] } },
            { managedProperties: { some: { propertyId: occ.propertyId, active: true } }, role: { not: 'HOSPEDE' } },
          ],
        },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      })
    : []

  const isSuggestion = occ.category === SUGGESTION_CATEGORY
  const name = occ.reporterName ?? occ.reportedBy?.name ?? null
  const email = occ.reportedBy?.email ?? occ.reservation?.guestEmail ?? null
  const phone = occ.reportedBy?.phone ?? occ.reservation?.guestPhone ?? null
  const phoneDigits = phone?.replace(/\D/g, '') ?? ''
  const waDigits = phoneDigits.length === 10 || phoneDigits.length === 11 ? `55${phoneDigits}` : phoneDigits
  const replyText = `Olá, ${formatFirstName(name)}! Aqui é da ${occ.property.name}. Obrigado pela sua mensagem sobre "${occ.title.replace(SUGGESTION_TITLE_PREFIX, '')}".`
  const whatsappHref = waDigits.length >= 12 ? `https://wa.me/${waDigits}?text=${encodeURIComponent(replyText)}` : null
  const mailHref = email ? `mailto:${email}?subject=${encodeURIComponent(`${occ.property.name} – sua mensagem`)}&body=${encodeURIComponent(replyText)}` : null

  const prestadorKind = occ.source === 'PRESTADOR' && occ.reportedById
    ? (await prisma.task.findFirst({
        where: { assigneeId: occ.reportedById, propertyId: occ.propertyId, type: { in: ['LIMPEZA', 'MANUTENCAO'] } },
        orderBy: { createdAt: 'desc' },
        select: { type: true },
      }))?.type ?? null
    : null

  const priority = PRIORITIES.find((p) => p.value === occ.priority)
  const statusText = isSuggestion ? suggestionStatusLabel(occ.status, occ.archivedAt) : occ.archivedAt ? 'Arquivada' : STATUS_LABEL[occ.status]

  return (
    <div className="font-display space-y-4 p-4 pt-6 text-[#0F172A]">
      <Link href={`${basePath}${isSuggestion ? '?aba=sugestoes' : ''}`} className="inline-flex items-center gap-1.5 text-sm text-[#64748B]">
        <ArrowLeft size={16} /> {isSuggestion ? 'Sugestões' : 'Ocorrências'}
      </Link>

      {/* Cabeçalho */}
      <div className="flex gap-3">
        <OccurrenceCategoryIcon category={occ.category} size={48} />
        <div className="min-w-0">
          <h1 className="text-lg font-extrabold leading-tight">{occ.title}</h1>
          <p className="mt-0.5 text-xs text-[#64748B]">{occ.property.name} · {categoryLabel(occ.category)} · {timeAgo(occ.createdAt)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            <OriginBadge source={occ.source} name={name} prestadorKind={prestadorKind} />
            <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-700">{statusText}</span>
            {!isSuggestion && priority && <span className={cn('rounded-full px-2 py-0.5 font-semibold', priority.cls)}>{priority.label}</span>}
            {occ.assignedTo && <span className="rounded-full bg-[#F1F5FF] px-2 py-0.5 font-semibold text-[#1A56DB]">Resp.: {occ.assignedTo.name}</span>}
          </div>
        </div>
      </div>

      <p className="whitespace-pre-line rounded-2xl bg-white p-4 text-sm leading-relaxed ring-1 ring-black/5">{occ.description}</p>

      {occ.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {occ.photos.map((src) => (
            <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden rounded-xl bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="Foto da ocorrência" className="h-full w-full object-cover" />
            </a>
          ))}
        </div>
      )}

      {occ.resolution && (
        <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Solução</p>
          <p className="mt-1 whitespace-pre-line text-sm text-emerald-900">{occ.resolution}</p>
        </div>
      )}

      {(occ.convertedFrom || occ.conversions.length > 0) && (
        <div className="space-y-1.5 rounded-2xl bg-violet-50 p-3 text-sm ring-1 ring-violet-200">
          {occ.convertedFrom && (
            <Link href={`${basePath}/${occ.convertedFrom.id}`} className="flex items-center gap-1.5 font-medium text-violet-800">
              <Link2 size={14} /> Veio da sugestão: {occ.convertedFrom.title.replace(SUGGESTION_TITLE_PREFIX, '')}
            </Link>
          )}
          {occ.conversions.map((c) => (
            <Link key={c.id} href={`${basePath}/${c.id}`} className="flex items-center gap-1.5 font-medium text-violet-800">
              <Link2 size={14} /> Virou a ocorrência: {c.title}
            </Link>
          ))}
        </div>
      )}

      {/* Contato de quem registrou */}
      {(name || email || phone) && (
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/5">
          {occ.reportedBy?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={occ.reportedBy.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EFF6FF] text-sm font-bold text-[#1A56DB]">
              {(name ?? '?').charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-semibold">{name ?? 'Sem nome'}</p>
            {email && <p className="truncate text-xs text-[#64748B]">{email}</p>}
            {occ.reservation && (
              <p className="truncate text-xs text-[#64748B]">
                Reserva: {occ.reservation.guestName} · {formatDateTimeBR(occ.reservation.checkIn).slice(0, 5)} a {formatDateTimeBR(occ.reservation.checkOut).slice(0, 5)}
              </p>
            )}
          </div>
          {phone && (
            <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} aria-label="Ligar" className="rounded-xl bg-[#F1F5FF] p-2.5 text-[#1A56DB]"><Phone size={16} /></a>
          )}
          {email && (
            <a href={`mailto:${email}`} aria-label="E-mail" className="rounded-xl bg-[#F1F5FF] p-2.5 text-[#1A56DB]"><Mail size={16} /></a>
          )}
        </div>
      )}

      <OccurrenceControls
        basePath={basePath}
        canManage={canManage}
        isAdmin={user.role === 'ADMINISTRADOR'}
        assignees={assignees}
        data={{
          id: occ.id, title: occ.title, description: occ.description, category: occ.category,
          status: occ.status, priority: occ.priority, archived: !!occ.archivedAt, assignedToId: occ.assignedToId,
          photos: occ.photos, isSuggestion, whatsappHref, mailHref,
        }}
      />

      {/* Linha do tempo */}
      <section>
        <h2 className="mb-3 text-sm font-extrabold">Linha do tempo</h2>
        {occ.events.length === 0 ? (
          <p className="text-sm text-[#64748B]">Sem eventos registrados.</p>
        ) : (
          <ol className="relative space-y-4 border-l-2 border-[#E2E8F0] pl-5">
            {occ.events.map((e) => (
              <li key={e.id} className="relative">
                <span className={cn('absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-[#F8FAFC]', EVENT_DOT[e.type] ?? 'bg-gray-400')} />
                <p className="text-sm font-semibold">
                  {EVENT_LABEL[e.type] ?? e.type}
                  {(e.fromValue || e.toValue) && e.type !== 'CRIADA' && e.type !== 'CONVERTIDA' && (
                    <span className="font-normal text-[#64748B]"> · {e.fromValue ?? '—'} → {e.toValue ?? '—'}</span>
                  )}
                </p>
                {e.message && <p className="mt-0.5 whitespace-pre-line text-sm text-[#334155]">{e.message}</p>}
                <p className="mt-0.5 text-[11px] text-[#94A3B8]">{e.actorLabel} · {formatDateTimeBR(e.createdAt)}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
