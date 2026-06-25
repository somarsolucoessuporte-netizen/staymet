import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { PropertyCard } from '@/components/shared/PropertyCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Plus, Building2 } from 'lucide-react'
import Link from 'next/link'

export default async function GestorPropertiesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const properties = await prisma.property.findMany({
    include: {
      _count: {
        select: {
          reservations: { where: { status: { in: ['CONFIRMADA', 'EM_ANDAMENTO'] } } },
          tasks: { where: { status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="p-4 pt-6">
      <PageHeader
        title="Imóveis"
        description={`${properties.length} imóvel${properties.length !== 1 ? 'is' : ''} cadastrado${properties.length !== 1 ? 's' : ''}`}
        action={
          <Link href={`/${locale}/gestor/properties/new`}>
            <Button size="sm" variant="accent">
              <Plus className="h-4 w-4" />
              Novo
            </Button>
          </Link>
        }
      />

      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum imóvel"
          description="Adicione seu primeiro imóvel para começar."
          action={
            <Link href={`/${locale}/gestor/properties/new`}>
              <Button variant="accent">
                <Plus className="h-4 w-4" />
                Adicionar Imóvel
              </Button>
            </Link>
          }
        />
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
              href={`/${locale}/gestor/properties/${prop.id}`}
              stats={{
                activeReservations: prop._count.reservations,
                pendingTasks: prop._count.tasks,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
