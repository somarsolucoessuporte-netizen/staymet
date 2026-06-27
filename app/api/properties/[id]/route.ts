import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true, email: true } },
    },
  })
  if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(property)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const caller = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!caller || !['GESTOR', 'ADMINISTRADOR'].includes(caller.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  const {
    name, description, type, address, city, state, zipCode, coverImageUrl,
    wifiName, wifiPassword, checkInTime, checkOutTime, maxGuests, rules, active,
    financeModel, commissionRate, monthlyFee, directCommission, paymentDay, financeNotes,
  } = body

  const updated = await prisma.property.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(type !== undefined && { type }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(zipCode !== undefined && { zipCode }),
      ...(coverImageUrl !== undefined && { coverImageUrl }),
      ...(wifiName !== undefined && { wifiName }),
      ...(wifiPassword !== undefined && { wifiPassword }),
      ...(checkInTime !== undefined && { checkInTime }),
      ...(checkOutTime !== undefined && { checkOutTime }),
      ...(maxGuests !== undefined && { maxGuests }),
      ...(rules !== undefined && { rules }),
      ...(active !== undefined && { active }),
      ...(financeModel !== undefined && { financeModel }),
      ...(commissionRate !== undefined && { commissionRate }),
      ...(monthlyFee !== undefined && { monthlyFee }),
      ...(directCommission !== undefined && { directCommission }),
      ...(paymentDay !== undefined && { paymentDay }),
      ...(financeNotes !== undefined && { financeNotes }),
    },
  })

  return NextResponse.json(updated)
}
