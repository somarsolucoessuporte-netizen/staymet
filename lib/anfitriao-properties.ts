import { prisma } from '@/lib/prisma'
import { listGuiaProperties, getCurrentDbUser } from '@/lib/guia-access'
import { getConflicts } from '@/lib/agenda-server'
import type { PropertyGuideInfo } from '@/components/anfitriao/PropertyGuideCard'

type DbUser = NonNullable<Awaited<ReturnType<typeof getCurrentDbUser>>>

/** Imóveis do anfitrião (ADMIN/GESTOR veem todos) com o necessário para os cards do guia (e conflitos da agenda) */
export async function getAnfitriaoProperties(user: DbUser): Promise<PropertyGuideInfo[]> {
  const ids = (await listGuiaProperties(user)).map((p) => p.id)
  if (ids.length === 0) return []

  const [rows, conflicts] = await Promise.all([prisma.property.findMany({
    where: { id: { in: ids } },
    select: {
      id: true, name: true, city: true, state: true, coverImageUrl: true, wifiName: true, wifiPassword: true,
      partners: { where: { partner: { active: true } }, select: { partnerId: true } },
    },
    orderBy: { name: 'asc' },
  }), getConflicts(ids)])

  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    city: p.city,
    state: p.state,
    coverImageUrl: p.coverImageUrl,
    hasWifi: !!(p.wifiName || p.wifiPassword),
    activeButtons: p.partners.length,
    conflicts: conflicts.filter((c) => c.propertyId === p.id).length,
  }))
}
