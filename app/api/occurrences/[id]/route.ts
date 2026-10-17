import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentDbUser } from '@/lib/guia-access'
import { canManageProperty, actorLabel } from '@/lib/occurrence-access'
import { STATUS_LABEL } from '@/lib/occurrences'

const schema = z.object({
  status: z.enum(['ABERTA', 'EM_ANDAMENTO', 'RESOLVIDA']).optional(),
  resolution: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const current = await prisma.occurrence.findUnique({ where: { id }, select: { propertyId: true, status: true } })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!(await canManageProperty(user, current.propertyId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const data: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.status === 'RESOLVIDA') {
    data.resolvedAt = new Date()
  }

  const next = parsed.data.status
  const [occurrence] = await prisma.$transaction([
    prisma.occurrence.update({ where: { id }, data }),
    ...(next && next !== current.status
      ? [prisma.occurrenceEvent.create({
          data: {
            occurrenceId: id,
            type: next === 'RESOLVIDA' ? 'RESOLVIDA' : current.status === 'RESOLVIDA' ? 'REABERTA' : 'STATUS',
            fromValue: STATUS_LABEL[current.status], toValue: STATUS_LABEL[next],
            message: parsed.data.resolution, actorId: user.id, actorLabel: actorLabel(user),
          },
        })]
      : []),
  ])
  return NextResponse.json(occurrence)
}
