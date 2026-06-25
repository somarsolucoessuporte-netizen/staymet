import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    })

    if (!dbUser || dbUser.role !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const inspections = await prisma.inspection.findMany({
      include: {
        property: {
          select: { name: true },
        },
        reservation: {
          select: { guestName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      inspections.map((i) => ({
        ...i,
        propertyName: i.property.name,
        guestName: i.reservation.guestName,
      }))
    )
  } catch (error) {
    console.error('Admin inspections error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
