import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentDbUser } from '@/lib/guia-access'
import { occurrenceScope, canContributeProperty, sourceForRole, actorLabel } from '@/lib/occurrence-access'
import { OPERATIONAL_CATEGORY_VALUES } from '@/lib/occurrences'

const schema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).default('MEDIA'),
  category: z.enum(OPERATIONAL_CATEGORY_VALUES).default('OPERACIONAL'),
  propertyId: z.string(),
  photos: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  const user = await getCurrentDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Só o que o usuário pode ver (anfitrião/proprietário: imóveis vinculados)
  const scope = occurrenceScope(user)
  if (scope === null) return NextResponse.json([])

  const { searchParams } = new URL(request.url)
  const propertyId = searchParams.get('propertyId')
  const status = searchParams.get('status')

  const occurrences = await prisma.occurrence.findMany({
    where: {
      AND: [
        scope,
        propertyId ? { propertyId } : {},
        status ? { status: status as 'ABERTA' | 'EM_ANDAMENTO' | 'RESOLVIDA' } : {},
      ],
    },
    include: {
      property: { select: { name: true } },
      reportedBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(occurrences)
}

export async function POST(request: NextRequest) {
  const user = await getCurrentDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  if (!(await canContributeProperty(user, parsed.data.propertyId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const occurrence = await prisma.occurrence.create({
    data: {
      ...parsed.data,
      photos: parsed.data.photos ?? [],
      reportedById: user.id,
      reporterName: user.name,
      source: sourceForRole(user.role),
      events: { create: { type: 'CRIADA', toValue: 'ABERTA', actorId: user.id, actorLabel: actorLabel(user) } },
    },
  })

  return NextResponse.json(occurrence, { status: 201 })
}
