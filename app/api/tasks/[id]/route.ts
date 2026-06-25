import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  status: z.enum(['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).optional(),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
  completedAt: z.string().datetime().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const data: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.status === 'CONCLUIDA' && !parsed.data.completedAt) {
    data.completedAt = new Date()
  }

  const task = await prisma.task.update({ where: { id }, data })
  return NextResponse.json(task)
}
