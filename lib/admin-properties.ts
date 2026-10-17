import { prisma } from '@/lib/prisma'

/** Quem pode ser dono de um imóvel no formulário (inclui o dono atual, seja qual for o papel) */
export async function getOwnerOptions(currentOwnerId?: string) {
  return prisma.user.findMany({
    where: {
      OR: [
        { role: { in: ['PROPRIETARIO', 'GESTOR', 'ADMINISTRADOR'] } },
        ...(currentOwnerId ? [{ id: currentOwnerId }] : []),
      ],
    },
    select: { id: true, name: true, email: true, role: true },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })
}
