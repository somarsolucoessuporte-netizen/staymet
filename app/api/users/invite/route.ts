import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const caller = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!caller || !['ADMINISTRADOR', 'GESTOR'].includes(caller.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  const { email, name, role, propertyIds } = body

  if (!email || !name || !role) {
    return NextResponse.json({ error: 'email, name e role são obrigatórios' }, { status: 400 })
  }

  // GESTOR só pode convidar ANFITRIAO e PRESTADOR
  if (caller.role === 'GESTOR' && !['ANFITRIAO', 'PRESTADOR'].includes(role)) {
    return NextResponse.json({ error: 'Gestor só pode convidar Anfitrião e Prestador' }, { status: 403 })
  }

  // Criar no Supabase Auth
  const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  let supabaseId = authData?.user?.id
  if (authError && authError.message.includes('already registered')) {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers()
    supabaseId = list.users.find((u: any) => u.email === email)?.id
    if (!supabaseId) return NextResponse.json({ error: authError.message }, { status: 400 })
  } else if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Criar / atualizar no Prisma
  const dbUser = await prisma.user.upsert({
    where: { email },
    update: { role, name },
    create: { supabaseId: supabaseId!, email, name, role },
  })

  // Vincular a imóveis
  if (propertyIds?.length) {
    for (const propertyId of propertyIds) {
      await prisma.propertyUser.upsert({
        where: { propertyId_userId: { propertyId, userId: dbUser.id } },
        update: { role },
        create: { propertyId, userId: dbUser.id, role },
      })
    }
  }

  // Enviar convite por email
  try {
    await supabaseAdmin.auth.admin.inviteUserByEmail(email)
  } catch {
    // ignora se já enviado ou política de convite desativada
  }

  return NextResponse.json({ success: true, user: dbUser, tempPassword })
}
