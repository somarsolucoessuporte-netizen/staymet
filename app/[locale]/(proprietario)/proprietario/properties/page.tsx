import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { PropertyCard } from '@/components/shared/PropertyCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Building2 } from 'lucide-react'

export default async function ProprietarioPropertiesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return null

  const properties = await prisma.property.findMany({
    where: { ownerId: dbUser.id },
    include: {
      _count: {
        select: {
          reservations: { where: { status: { in: ['CONFIRMADA', 'EM_ANDAMENTO'] } } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="p-4 pt-6">
      <PageHeader title="Meus Imóveis" description={`${properties.length} imóveis`} />

      {properties.length === 0 ? (
        <EmptyState icon={Building2} title="Nenhum imóvel" description="Você ainda não possui imóveis cadastrados." />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {properties.map((prop) => (
            <PropertyCard
              key={prop.id}
              id={prop.id}
              name={prop.name}
              city={prop.city}
              state={prop.state}
              type={prop.type}
              maxGuests={prop.maxGuests}
              active={prop.active}
              coverImageUrl={prop.coverImageUrl}
              stats={{ activeReservations: prop._count.reservations }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
