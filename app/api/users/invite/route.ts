import { NextRequest, NextResponse } from 'next/server'
import { Role } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'

// Papéis que um GESTOR pode atribuir — e as únicas contas existentes que ele pode alterar
const GESTOR_ASSIGNABLE: Role[] = ['ANFITRIAO', 'PRESTADOR']
const GESTOR_EDITABLE: Role[] = ['ANFITRIAO', 'PRESTADOR', 'HOSPEDE']

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

  if (!Object.values(Role).includes(role)) {
    return NextResponse.json({ error: 'Papel inválido' }, { status: 400 })
  }

  // GESTOR só pode convidar ANFITRIAO e PRESTADOR
  if (caller.role === 'GESTOR' && !GESTOR_ASSIGNABLE.includes(role)) {
    return NextResponse.json({ error: 'Gestor só pode convidar Anfitrião e Prestador' }, { status: 403 })
  }

  // O upsert abaixo altera o papel de contas existentes: GESTOR não pode mexer em ADMINISTRADOR/GESTOR/PROPRIETARIO
  const existing = await prisma.user.findUnique({ where: { email }, select: { role: true } })
  if (existing && caller.role === 'GESTOR' && !GESTOR_EDITABLE.includes(existing.role)) {
    return NextResponse.json({ error: 'Sem permissão para alterar este usuário' }, { status: 403 })
  }

  const supabaseAdmin = createAdminClient()

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
    supabaseId = list.users.find((u) => u.email === email)?.id
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
