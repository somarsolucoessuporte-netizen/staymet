import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  reservationId: z.string(),
  type: z.enum(['LIMPEZA', 'MANUTENCAO', 'INFORMACAO', 'OUTRO']),
  message: z.string().min(5),
  guestId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const guestRequest = await prisma.guestRequest.create({
    data: parsed.data,
  })

  return NextResponse.json(guestRequest, { status: 201 })
}
