import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [activeReservations, pendingTasks, openOccurrences] = await Promise.all([
    prisma.reservation.count({
      where: { propertyId: id, status: { in: ['CONFIRMADA', 'EM_ANDAMENTO'] } },
    }),
    prisma.task.count({
      where: { propertyId: id, status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } },
    }),
    prisma.occurrence.count({
      where: { propertyId: id, status: { in: ['ABERTA', 'EM_ANDAMENTO'] } },
    }),
  ])

  return NextResponse.json({ activeReservations, pendingTasks, openOccurrences })
}
