import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * Leitura de ocorrências compatível com o banco antes e depois de
 * prisma/migrations/add_ocorrencias_sugestoes.sql (colunas category/source/archivedAt).
 * Enquanto o SQL não roda, conta só por status e trata tudo como origem PAINEL.
 * Remover este arquivo quando o schema.prisma tiver as colunas novas.
 */

let hasNewColumns = false // só cacheia o "sim": depois do SQL, o próximo deploy usa o schema novo

async function newColumnsAvailable() {
  if (hasNewColumns) return true
  try {
    const rows = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT count(*)::bigint AS n FROM information_schema.columns
      WHERE table_name = 'Occurrence' AND column_name IN ('category', 'source', 'archivedAt')`
    hasNewColumns = Number(rows[0]?.n ?? 0) === 3
  } catch {
    hasNewColumns = false
  }
  return hasNewColumns
}

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

export async function getOccurrenceSummary(propertyIds: string[]) {
  if (propertyIds.length === 0) {
    return { suggestionsNew: 0, openOccurrences: 0, attention: [] as AttentionItem[], hasCategories: false }
  }

  if (await newColumnsAvailable()) {
    const ids = Prisma.join(propertyIds)
    const [counts, attention] = await Promise.all([
      prisma.$queryRaw<{ sug: bigint; occ: bigint }[]>`
        SELECT
          count(*) FILTER (WHERE "category" = 'SUGESTAO' AND "status" = 'ABERTA')::bigint AS sug,
          count(*) FILTER (WHERE "category" <> 'SUGESTAO' AND "status" IN ('ABERTA', 'EM_ANDAMENTO'))::bigint AS occ
        FROM "Occurrence"
        WHERE "propertyId" IN (${ids}) AND "archivedAt" IS NULL`,
      prisma.$queryRaw<AttentionItem[]>`
        SELECT o."id", o."title", o."status"::text AS "status", o."createdAt",
               p."name" AS "propertyName", o."category", o."source",
               COALESCE(o."reporterName", u."name") AS "reporterName"
        FROM "Occurrence" o
        JOIN "Property" p ON p."id" = o."propertyId"
        LEFT JOIN "User" u ON u."id" = o."reportedById"
        WHERE o."propertyId" IN (${ids}) AND o."archivedAt" IS NULL
          AND o."status" IN ('ABERTA', 'EM_ANDAMENTO')
        ORDER BY o."createdAt" DESC
        LIMIT 5`,
    ])
    return {
      suggestionsNew: Number(counts[0]?.sug ?? 0),
      openOccurrences: Number(counts[0]?.occ ?? 0),
      attention,
      hasCategories: true,
    }
  }

  // Fallback: banco ainda sem as colunas novas
  const where: Prisma.OccurrenceWhereInput = { propertyId: { in: propertyIds }, status: { in: ['ABERTA', 'EM_ANDAMENTO'] } }
  const [openOccurrences, rows] = await Promise.all([
    prisma.occurrence.count({ where }),
    prisma.occurrence.findMany({
      where,
      select: {
        id: true, title: true, status: true, createdAt: true,
        property: { select: { name: true } },
        reportedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])
  return {
    suggestionsNew: 0,
    openOccurrences,
    attention: rows.map((r) => ({
      id: r.id, title: r.title, status: r.status, createdAt: r.createdAt,
      propertyName: r.property.name, category: 'OPERACIONAL', source: 'PAINEL',
      reporterName: r.reportedBy?.name ?? null,
    })),
    hasCategories: false,
  }
}
