import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getOwnerOptions } from '@/lib/admin-properties'
import { PropertyForm } from '@/components/admin/PropertyForm'

export default async function EditarImovelPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params

  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      name: true, description: true, type: true, ownerId: true, maxGuests: true, active: true,
      address: true, city: true, state: true, zipCode: true, coverImageUrl: true,
      checkInTime: true, checkOutTime: true, rules: true,
      wifiName: true, wifiPassword: true, deliveryInstructions: true,
    },
  })
  if (!property) notFound()

  const owners = await getOwnerOptions(property.ownerId)
  const { active, ...initial } = property

  return (
    <div className="font-display min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <Link href={`/${locale}/admin/imoveis`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#1A56DB]">
          <ArrowLeft size={16} /> Imóveis
        </Link>
        <h1 className="text-2xl font-extrabold">Editar imóvel</h1>
        <p className="mb-5 text-sm text-[#64748B]">
          {property.name}
          {!active && <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">Inativo</span>}
        </p>
        <PropertyForm locale={locale} propertyId={id} initial={initial} owners={owners} />
      </div>
    </div>
  )
}
