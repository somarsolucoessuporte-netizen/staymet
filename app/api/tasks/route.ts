import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(['LIMPEZA', 'MANUTENCAO', 'VISTORIA_ENTRADA', 'VISTORIA_SAIDA', 'OUTRO']),
  propertyId: z.string(),
  reservationId: z.string().optional(),
  assigneeId: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const propertyId = searchParams.get('propertyId')
  const status = searchParams.get('status')
  const assigneeId = searchParams.get('assigneeId')

  const tasks = await prisma.task.findMany({
    where: {
      ...(propertyId ? { propertyId } : {}),
      ...(status ? { status: status as 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA' } : {}),
      ...(assigneeId ? { assigneeId } : {}),
      ...(dbUser.role === 'PRESTADOR' ? { assigneeId: dbUser.id } : {}),
    },
    include: {
      property: { select: { name: true } },
      assignee: { select: { name: true } },
    },
    orderBy: { scheduledFor: 'asc' },
    take: 100,
  })

  return NextResponse.json(tasks)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      creatorId: dbUser.id,
      scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : undefined,
    },
  })

  return NextResponse.json(task, { status: 201 })
}
