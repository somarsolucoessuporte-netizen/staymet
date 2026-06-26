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
  const { id } = await params
  const body = await request.json()
  const { magicToken, ...rest } = body

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let authorized = !!user

  // Autorização via magic token para prestadores sem sessão
  if (!authorized && magicToken) {
    try {
      const link = await prisma.magicLink.findUnique({ where: { token: magicToken } })
      if (
        link &&
        link.active &&
        !link.revokedAt &&
        new Date() < link.expiresAt &&
        link.taskId === id
      ) {
        authorized = true
      }
    } catch {
      // MagicLink pode não existir ainda
    }
  }

  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(rest)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const data: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.status === 'CONCLUIDA' && !parsed.data.completedAt) {
    data.completedAt = new Date()
  }

  const task = await prisma.task.update({ where: { id }, data })
  return NextResponse.json(task)
}
