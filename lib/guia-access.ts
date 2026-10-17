import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// Quem pode editar o guia de qualquer imóvel
const FULL_ACCESS_ROLES = ['ADMINISTRADOR', 'GESTOR']

export async function getCurrentDbUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return prisma.user.findUnique({ where: { supabaseId: user.id } })
}

type DbUser = NonNullable<Awaited<ReturnType<typeof getCurrentDbUser>>>

/** Imóveis cujo guia o usuário pode configurar */
export async function listGuiaProperties(user: DbUser) {
  if (FULL_ACCESS_ROLES.includes(user.role)) {
    return prisma.property.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
  }
  if (user.role !== 'ANFITRIAO') return []
  return prisma.property.findMany({
    where: { active: true, users: { some: { userId: user.id, active: true } } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}

export async function canEditGuia(user: DbUser, propertyId: string) {
  if (FULL_ACCESS_ROLES.includes(user.role)) return true
  if (user.role !== 'ANFITRIAO') return false
  const link = await prisma.propertyUser.findFirst({
    where: { propertyId, userId: user.id, active: true },
    select: { id: true },
  })
  return !!link
}
