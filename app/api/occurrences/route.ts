import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).default('MEDIA'),
  propertyId: z.string(),
  photos: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const propertyId = searchParams.get('propertyId')
  const status = searchParams.get('status')

  const occurrences = await prisma.occurrence.findMany({
    where: {
      ...(propertyId ? { propertyId } : {}),
      ...(status ? { status: status as 'ABERTA' | 'EM_ANDAMENTO' | 'RESOLVIDA' } : {}),
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const occurrence = await prisma.occurrence.create({
    data: { ...parsed.data, reportedById: dbUser.id, photos: parsed.data.photos ?? [] },
  })

  return NextResponse.json(occurrence, { status: 201 })
}
