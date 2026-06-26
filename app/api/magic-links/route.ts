import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  type: z.enum(['PRESTADOR', 'HOSPEDE']),
  taskId: z.string().optional(),
  reservationId: z.string().optional(),
  prestadorName: z.string().optional(),
  prestadorPhone: z.string().optional(),
  guestName: z.string().optional(),
  expiresInDays: z.number().default(7),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser || !['GESTOR', 'ADMINISTRADOR', 'ANFITRIAO'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = schema.parse(await req.json())
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + body.expiresInDays)

  const magicLink = await prisma.magicLink.create({
    data: {
      type: body.type,
      expiresAt,
      taskId: body.taskId,
      reservationId: body.reservationId,
      prestadorName: body.prestadorName,
      prestadorPhone: body.prestadorPhone,
      guestName: body.guestName,
      createdById: dbUser.id,
    },
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://staymet-rosy.vercel.app'
  const url =
    body.type === 'PRESTADOR'
      ? `${baseUrl}/acesso/prestador/${magicLink.token}`
      : `${baseUrl}/acesso/hospede/${magicLink.token}`

  const whatsappMsg =
    body.type === 'PRESTADOR'
      ? `Olá ${body.prestadorName ?? ''}! Suas tarefas de hoje estão aqui: ${url}`
      : `Olá ${body.guestName ?? ''}! Acesse as informações da sua estadia: ${url}`

  const whatsappUrl = body.prestadorPhone
    ? `https://wa.me/55${body.prestadorPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMsg)}`
    : null

  return NextResponse.json({
    token: magicLink.token,
    url,
    whatsappUrl,
    expiresAt: magicLink.expiresAt,
  })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser || !['GESTOR', 'ADMINISTRADOR', 'ANFITRIAO'].includes(dbUser.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const links = await prisma.magicLink.findMany({
    where: { createdById: dbUser.id, active: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json(links)
}
