import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'

// Cadastro público: qualquer `role` no body é ignorado — autocadastro é sempre HOSPEDE.
// Papéis maiores só via /api/users/invite (exige ADMINISTRADOR ou GESTOR logado).
const schema = z.object({
  supabaseId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { supabaseId, name } = parsed.data

  // Confere no Supabase Auth que a conta existe; o e-mail vem de lá, não do body.
  // (Não dá para exigir sessão: com confirmação de e-mail ativa, o signUp não abre sessão.)
  const { data: authData, error: authError } = await createAdminClient().auth.admin.getUserById(supabaseId)
  const email = authData?.user?.email
  if (authError || !email) {
    return NextResponse.json({ error: 'Conta não encontrada' }, { status: 400 })
  }

  // Nunca altera um usuário existente (antes era possível trocar nome/papel de qualquer conta)
  const existing = await prisma.user.findUnique({ where: { supabaseId } })
  if (existing) {
    return NextResponse.json({ id: existing.id, role: existing.role }, { status: 200 })
  }

  const sameEmail = await prisma.user.findUnique({ where: { email } })
  if (sameEmail) {
    return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
  }

  const user = await prisma.user.create({
    data: { supabaseId, name, email, role: 'HOSPEDE' },
    select: { id: true, role: true },
  })

  return NextResponse.json(user, { status: 201 })
}
