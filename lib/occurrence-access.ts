import type { Prisma, Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentDbUser } from '@/lib/guia-access'

// Quem vê e quem mexe em ocorrências/sugestões
//   ADMINISTRADOR / GESTOR  → tudo
//   ANFITRIAO               → imóveis vinculados (PropertyUser ativo)
//   PROPRIETARIO            → imóveis dele (ownerId) ou vinculados
//   PRESTADOR               → só vê/cria/comenta onde tem tarefa
//   HOSPEDE                 → nada no painel (usa a caixinha de sugestões)

export type DbUser = NonNullable<Awaited<ReturnType<typeof getCurrentDbUser>>>

const FULL: Role[] = ['ADMINISTRADOR', 'GESTOR']

/** Filtro de imóveis que o usuário pode VER */
export function propertyScope(user: DbUser): Prisma.PropertyWhereInput | null {
  if (FULL.includes(user.role)) return {}
  if (user.role === 'ANFITRIAO') return { users: { some: { userId: user.id, active: true } } }
  if (user.role === 'PROPRIETARIO') return { OR: [{ ownerId: user.id }, { users: { some: { userId: user.id, active: true } } }] }
  if (user.role === 'PRESTADOR') return { tasks: { some: { assigneeId: user.id } } }
  return null
}

/** Filtro de ocorrências que o usuário pode ver (null = nenhuma) */
export function occurrenceScope(user: DbUser): Prisma.OccurrenceWhereInput | null {
  const scope = propertyScope(user)
  if (scope === null) return null
  return FULL.includes(user.role) ? {} : { property: scope }
}

async function propertyMatches(propertyId: string, scope: Prisma.PropertyWhereInput | null) {
  if (scope === null) return false
  const n = await prisma.property.count({ where: { id: propertyId, ...scope } })
  return n > 0
}

/** Editar, mudar status/prioridade, atribuir, resolver, arquivar */
export async function canManageProperty(user: DbUser, propertyId: string) {
  if (user.role === 'PRESTADOR' || user.role === 'HOSPEDE') return false
  return propertyMatches(propertyId, propertyScope(user))
}

/** Criar ocorrência e comentar (inclui PRESTADOR onde tem tarefa) */
export async function canContributeProperty(user: DbUser, propertyId: string) {
  return propertyMatches(propertyId, propertyScope(user))
}

/** Imóveis ativos onde o usuário pode criar ocorrência */
export async function listContributableProperties(user: DbUser) {
  const scope = propertyScope(user)
  if (scope === null) return []
  return prisma.property.findMany({
    where: { active: true, ...scope },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}

/** Origem gravada na ocorrência = papel de quem registrou pelo painel */
export function sourceForRole(role: Role) {
  return role === 'HOSPEDE' ? 'HOSPEDE' : role
}

/** Rótulo do autor na linha do tempo, ex.: "Gestor – Ana Lima" */
const ROLE_LABEL: Record<string, string> = {
  ADMINISTRADOR: 'Admin', GESTOR: 'Gestor', ANFITRIAO: 'Anfitrião',
  PROPRIETARIO: 'Proprietário', PRESTADOR: 'Prestador', HOSPEDE: 'Hóspede',
}
export function actorLabel(user: Pick<DbUser, 'name' | 'role'>) {
  return `${ROLE_LABEL[user.role] ?? user.role} – ${user.name}`
}
