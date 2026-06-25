import { prisma } from '@/lib/prisma'
import { PropertyCard } from '@/components/shared/PropertyCard'
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
    <div className="p-5 lg:p-8 pb-24 lg:pb-8 max-w-6xl mx-auto">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Imóveis
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {properties.length} imóvel{properties.length !== 1 ? 'is' : ''} cadastrado{properties.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href={`/${locale}/gestor/properties/new`}>
          <Button
            size="sm"
            className="bg-[#1A56DB] hover:bg-[#1648C0] text-white font-semibold rounded-xl px-4 h-9 flex items-center gap-2 shadow-sm"
          >
            <Plus size={15} />
            Novo imóvel
          </Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={24} className="text-[#1A56DB]" />
          </div>
          <p className="font-semibold text-gray-800 mb-1">Nenhum imóvel</p>
          <p className="text-sm text-gray-400 mb-6">Adicione seu primeiro imóvel para começar.</p>
          <Link href={`/${locale}/gestor/properties/new`}>
            <Button className="bg-[#1A56DB] hover:bg-[#1648C0] text-white font-semibold rounded-xl">
              <Plus size={15} className="mr-2" />
              Adicionar Imóvel
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
