import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  type: z.enum(['ENTRADA', 'SAIDA']),
  propertyId: z.string(),
  reservationId: z.string(),
  checklist: z.array(z.object({ item: z.string(), ok: z.boolean(), note: z.string().optional() })),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
  signedByGuest: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const inspection = await prisma.inspection.create({
    data: {
      ...parsed.data,
      photos: parsed.data.photos ?? [],
      signedByGuest: parsed.data.signedByGuest ?? false,
    },
  })

  return NextResponse.json(inspection, { status: 201 })
}
