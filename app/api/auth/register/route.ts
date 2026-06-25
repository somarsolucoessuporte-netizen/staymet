import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  supabaseId: z.string(),
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['PROPRIETARIO', 'GESTOR', 'ANFITRIAO', 'HOSPEDE', 'PRESTADOR']),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { supabaseId, name, email, role } = parsed.data

  const user = await prisma.user.upsert({
    where: { supabaseId },
    create: { supabaseId, name, email, role },
    update: { name, role },
  })

  return NextResponse.json(user, { status: 201 })
}
