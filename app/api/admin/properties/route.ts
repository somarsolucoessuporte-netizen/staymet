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

    const properties = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        city: true,
        active: true,
        owner: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      properties.map((p) => ({
        ...p,
        ownerName: p.owner.name,
        owner: undefined,
      }))
    )
  } catch (error) {
    console.error('Admin properties error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
