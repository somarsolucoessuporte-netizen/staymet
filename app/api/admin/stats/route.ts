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

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    })

    if (!dbUser || dbUser.role !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch stats
    const totalClients = await prisma.user.count({
      where: { role: 'PROPRIETARIO' },
    })

    const totalProperties = await prisma.property.count({
      where: { active: true },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const activeReservationsToday = await prisma.reservation.count({
      where: {
        checkIn: { lte: tomorrow },
        checkOut: { gte: today },
        status: 'EM_ANDAMENTO',
      },
    })

    const pendingInspections = await prisma.task.count({
      where: {
        type: 'VISTORIA_ENTRADA',
        status: 'PENDENTE',
      },
    })

    return NextResponse.json({
      totalClients,
      totalProperties,
      activeReservationsToday,
      pendingInspections,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
