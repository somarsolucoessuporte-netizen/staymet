import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  propertyId: z.string(),
  guestName: z.string().min(2),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  guestCount: z.number().int().positive().default(1),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  platform: z.string().optional(),
  platformCode: z.string().optional(),
  totalAmount: z.number().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const propertyId = searchParams.get('propertyId')
  const status = searchParams.get('status')

  const reservations = await prisma.reservation.findMany({
    where: {
      ...(propertyId ? { propertyId } : {}),
      ...(status ? { status: status as 'CONFIRMADA' | 'EM_ANDAMENTO' | 'ENCERRADA' | 'CANCELADA' } : {}),
    },
    include: {
      property: { select: { name: true, city: true } },
    },
    orderBy: { checkIn: 'desc' },
    take: 50,
  })

  return NextResponse.json(reservations)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const reservation = await prisma.reservation.create({
    data: {
      ...parsed.data,
      checkIn: new Date(parsed.data.checkIn),
      checkOut: new Date(parsed.data.checkOut),
      totalAmount: parsed.data.totalAmount ?? undefined,
    },
  })

  return NextResponse.json(reservation, { status: 201 })
}
