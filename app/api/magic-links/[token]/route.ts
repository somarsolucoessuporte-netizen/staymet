import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const link = await prisma.magicLink.findUnique({
    where: { token },
    include: {
      task: {
        include: {
          property: {
            select: {
              name: true, address: true, city: true, state: true,
              wifiName: true, wifiPassword: true,
              checkInTime: true, checkOutTime: true,
              rules: true, coverImageUrl: true,
            },
          },
        },
      },
      reservation: {
        include: {
          property: {
            select: {
              name: true, address: true, city: true, state: true,
              wifiName: true, wifiPassword: true,
              checkInTime: true, checkOutTime: true,
              rules: true, coverImageUrl: true, maxGuests: true,
            },
          },
        },
      },
    },
  })

  if (!link) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
  if (!link.active || link.revokedAt) return NextResponse.json({ error: 'Link revogado' }, { status: 410 })
  if (new Date() > link.expiresAt) return NextResponse.json({ error: 'Link expirado' }, { status: 410 })

  if (!link.usedAt) {
    await prisma.magicLink.update({
      where: { token },
      data: { usedAt: new Date() },
    })
  }

  return NextResponse.json({ link, valid: true })
}
