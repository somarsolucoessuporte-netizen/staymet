import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  status: z.enum(['ABERTA', 'EM_ANDAMENTO', 'RESOLVIDA']).optional(),
  resolution: z.string().optional(),
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
  if (parsed.data.status === 'RESOLVIDA') {
    data.resolvedAt = new Date()
  }

  const occurrence = await prisma.occurrence.update({ where: { id }, data })
  return NextResponse.json(occurrence)
}
