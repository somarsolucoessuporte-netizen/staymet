import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { Plus, Search, ChevronRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getCurrentDbUser } from '@/lib/guia-access'
import { occurrenceScope, propertyScope } from '@/lib/occurrence-access'
import {
  OPERATIONAL_CATEGORIES, SOURCES, PRIORITIES, STATUS_LABEL, SUGGESTION_CATEGORY, SUGGESTION_TITLE_PREFIX,
  categoryLabel, suggestionStatusLabel, timeAgo, formatDateTimeBR,
} from '@/lib/occurrences'
import { OriginBadge } from '@/components/shared/OriginBadge'
import { OccurrenceCategoryIcon } from '@/components/ocorrencias/OccurrenceCategoryIcon'
import { cn } from '@/lib/utils'

export type OccurrencesSearch = { aba?: string; imovel?: string; origem?: string; categoria?: string; q?: string }

const TABS = [
  { key: 'abertas',    label: 'Abertas' },
  { key: 'andamento',  label: 'Em andamento' },
  { key: 'resolvidas', label: 'Resolvidas' },
  { key: 'arquivadas', label: 'Arquivadas' },
  { key: 'sugestoes',  label: 'Sugestões' },
] as const
type TabKey = (typeof TABS)[number]['key']

function tabWhere(tab: TabKey): Prisma.OccurrenceWhereInput {
  const ops = { category: { not: SUGGESTION_CATEGORY }, archivedAt: null }
  switch (tab) {
    case 'abertas':    return { ...ops, status: 'ABERTA' }
    case 'andamento':  return { ...ops, status: 'EM_ANDAMENTO' }
    case 'resolvidas': return { ...ops, status: 'RESOLVIDA' }
    case 'arquivadas': return { archivedAt: { not: null } }
    case 'sugestoes':  return { category: SUGGESTION_CATEGORY, archivedAt: null }
  }
}

/** Lista de ocorrências e sugestões — mesma tela para admin, gestor e anfitrião */
export async function OccurrencesView({ basePath, search }: { basePath: string; search: OccurrencesSearch }) {
  const user = await getCurrentDbUser()
  const scope = user ? occurrenceScope(user) : null
  if (!user || scope === null) {
    return <p className="p-6 text-sm text-[#64748B]">Sem acesso a ocorrências.</p>
  }

  const tab: TabKey = (TABS.find((t) => t.key === search.aba)?.key ?? 'abertas') as TabKey
  const q = search.q?.trim() ?? ''
  const filters: Prisma.OccurrenceWhereInput[] = [
    ...(search.imovel ? [{ propertyId: search.imovel }] : []),
    ...(search.origem ? [{ source: search.origem }] : []),
    ...(search.categoria && tab !== 'sugestoes' ? [{ category: search.categoria }] : []),
    ...(q
      ? [{ OR: [{ title: { contains: q, mode: 'insensitive' as const } }, { description: { contains: q, mode: 'insensitive' as const } }, { reporterName: { contains: q, mode: 'insensitive' as const } }] }]
      : []),
  ]
  const where: Prisma.OccurrenceWhereInput = { AND: [scope, tabWhere(tab), ...filters] }

  const pScope = propertyScope(user) ?? {}
  const [items, counts, properties] = await Promise.all([
    prisma.occurrence.findMany({
      where,
      select: {
        id: true, title: true, status: true, priority: true, category: true, source: true, createdAt: true,
        archivedAt: true, reporterName: true, reporterContact: true, propertyId: true, reportedById: true,
        property: { select: { name: true } },
        reportedBy: { select: { name: true, avatarUrl: true, email: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    Promise.all(TABS.map((t) => prisma.occurrence.count({ where: { AND: [scope, tabWhere(t.key)] } }))),
    prisma.property.findMany({ where: { active: true, ...pScope }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  // Prestador: selo "Limpeza" ou "Manutenção" conforme a tarefa dele no imóvel
  const prestadorIds = [...new Set(items.filter((i) => i.source === 'PRESTADOR' && i.reportedById).map((i) => i.reportedById!))]
  const tasks = prestadorIds.length
    ? await prisma.task.findMany({
        where: { assigneeId: { in: prestadorIds }, type: { in: ['LIMPEZA', 'MANUTENCAO'] } },
        select: { assigneeId: true, propertyId: true, type: true },
        orderBy: { createdAt: 'desc' },
      })
    : []
  const kindOf = (userId: string | null, propertyId: string) =>
    tasks.find((t) => t.assigneeId === userId && t.propertyId === propertyId)?.type ??
    tasks.find((t) => t.assigneeId === userId)?.type ?? null

  const href = (patch: Partial<OccurrencesSearch>) => {
    const params = new URLSearchParams()
    const merged = { ...search, ...patch }
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v)
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  const selectCls = 'h-10 min-w-0 flex-1 rounded-xl border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#0F172A]'
  const isSuggestions = tab === 'sugestoes'

  return (
    <div className="font-display space-y-4 p-4 pt-6 text-[#0F172A]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">Ocorrências</h1>
          <p className="text-sm text-[#64748B]">Problemas da operação e sugestões dos hóspedes</p>
        </div>
        {user.role !== 'HOSPEDE' && (
          <Link
            href={`${basePath}/nova`}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#1A56DB] px-3.5 text-sm font-semibold text-white active:scale-[0.98]"
          >
            <Plus size={16} /> Nova
          </Link>
        )}
      </div>

      {/* Abas */}
      <nav className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {TABS.map((t, i) => (
          <Link
            key={t.key}
            href={href({ aba: t.key, categoria: undefined })}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition',
              t.key === tab ? 'bg-[#0F172A] text-white' : 'bg-white text-[#475569] ring-1 ring-[#E2E8F0]',
            )}
          >
            {t.label}
            <span className={cn('rounded-full px-1.5 text-[10px]', t.key === tab ? 'bg-white/20' : 'bg-gray-100')}>{counts[i]}</span>
          </Link>
        ))}
      </nav>

      {/* Filtros + busca (GET) */}
      <form action={basePath} className="space-y-2">
        <input type="hidden" name="aba" value={tab} />
        <div className="flex items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-[#E2E8F0]">
          <Search size={16} className="text-gray-400" />
          <input name="q" defaultValue={q} placeholder="Buscar por título, texto ou nome…" className="h-10 flex-1 bg-transparent text-sm outline-none" />
        </div>
        <div className="flex gap-2">
          <select name="imovel" defaultValue={search.imovel ?? ''} className={selectCls} aria-label="Imóvel">
            <option value="">Todos os imóveis</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select name="origem" defaultValue={search.origem ?? ''} className={selectCls} aria-label="Origem">
            <option value="">Toda origem</option>
            {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {!isSuggestions && (
            <select name="categoria" defaultValue={search.categoria ?? ''} className={selectCls} aria-label="Categoria">
              <option value="">Toda categoria</option>
              {OPERATIONAL_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          )}
        </div>
        <button type="submit" className="h-9 w-full rounded-xl bg-[#F1F5FF] text-xs font-semibold text-[#1A56DB]">Filtrar</button>
      </form>

      {/* Lista */}
      {items.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-[#64748B] ring-1 ring-black/5">
          {isSuggestions ? 'Nenhuma sugestão por aqui.' : 'Nenhuma ocorrência nesta aba.'}
        </p>
      ) : (
        <div className="space-y-2.5">
          {items.map((o) => {
            const suggestion = o.category === SUGGESTION_CATEGORY
            const priority = PRIORITIES.find((p) => p.value === o.priority)
            const name = o.reporterName ?? o.reportedBy?.name ?? null
            return (
              <Link
                key={o.id}
                href={`${basePath}/${o.id}`}
                className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition active:scale-[0.99]"
              >
                {suggestion && o.reportedBy?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.reportedBy.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <OccurrenceCategoryIcon category={o.category} />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">
                    {suggestion ? o.title.replace(SUGGESTION_TITLE_PREFIX, '') : o.title}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[#64748B]">
                    <OriginBadge source={o.source} name={name} prestadorKind={kindOf(o.reportedById, o.propertyId)} />
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-700">
                      {suggestion ? suggestionStatusLabel(o.status, o.archivedAt) : o.archivedAt ? 'Arquivada' : STATUS_LABEL[o.status]}
                    </span>
                    {!suggestion && priority && (
                      <span className={cn('rounded-full px-2 py-0.5 font-semibold', priority.cls)}>{priority.label}</span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-[#64748B]">
                    {o.property.name}
                    {suggestion
                      ? ` · ${name ?? 'Hóspede'}${o.reporterContact ? ` · ${o.reporterContact.split(' · ')[0]}` : ''} · ${formatDateTimeBR(o.createdAt)}`
                      : ` · ${categoryLabel(o.category)} · ${timeAgo(o.createdAt)}${o.assignedTo ? ` · ${o.assignedTo.name}` : ''}`}
                  </span>
                </span>
                <ChevronRight size={18} className="mt-2.5 shrink-0 text-[#94A3B8]" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
