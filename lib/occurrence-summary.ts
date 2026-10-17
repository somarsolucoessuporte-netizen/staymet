import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { occurrenceScope, type DbUser } from '@/lib/occurrence-access'
import { SUGGESTION_CATEGORY } from '@/lib/occurrences'

export type AttentionItem = {
  id: string
  title: string
  status: string
  createdAt: Date
  propertyName: string
  category: string
  source: string
  reporterName: string | null
}

/** Números e "Precisa da sua atenção" do painel, sempre no escopo do usuário */
export async function getOccurrenceSummary(user: DbUser) {
  const scope = occurrenceScope(user)
  if (scope === null) return { suggestionsNew: 0, openOccurrences: 0, attention: [] as AttentionItem[] }

  const open: Prisma.OccurrenceWhereInput = { archivedAt: null, status: { in: ['ABERTA', 'EM_ANDAMENTO'] } }
  const [suggestionsNew, openOccurrences, rows] = await Promise.all([
    prisma.occurrence.count({ where: { AND: [scope, { category: SUGGESTION_CATEGORY, status: 'ABERTA', archivedAt: null }] } }),
    prisma.occurrence.count({ where: { AND: [scope, open, { category: { not: SUGGESTION_CATEGORY } }] } }),
    prisma.occurrence.findMany({
      // sugestões só entram enquanto "Nova"; ocorrências enquanto abertas/em andamento
      where: {
        AND: [scope, { archivedAt: null }, {
          OR: [
            { category: SUGGESTION_CATEGORY, status: 'ABERTA' },
            { category: { not: SUGGESTION_CATEGORY }, status: { in: ['ABERTA', 'EM_ANDAMENTO'] } },
          ],
        }],
      },
      select: {
        id: true, title: true, status: true, createdAt: true, category: true, source: true, reporterName: true,
        property: { select: { name: true } },
        reportedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  return {
    suggestionsNew,
    openOccurrences,
    attention: rows.map((r) => ({
      id: r.id, title: r.title, status: r.status, createdAt: r.createdAt, propertyName: r.property.name,
      category: r.category, source: r.source, reporterName: r.reporterName ?? r.reportedBy?.name ?? null,
    })),
  }
}
