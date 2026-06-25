import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json()

    const inspection = await prisma.inspection.update({
      where: { id: params.id },
      data: {
        ...body,
      },
    })

    return NextResponse.json(inspection)
  } catch (error) {
    console.error('Admin inspection update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
