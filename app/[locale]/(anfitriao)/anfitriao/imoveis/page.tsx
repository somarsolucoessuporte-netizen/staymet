import { Building2 } from 'lucide-react'
import { getCurrentDbUser } from '@/lib/guia-access'
import { getAnfitriaoProperties } from '@/lib/anfitriao-properties'
import { getRequestOrigin } from '@/lib/request-origin'
import { PropertyGuideCard } from '@/components/anfitriao/PropertyGuideCard'

// Imóveis vinculados ao anfitrião, com os atalhos do guia do hóspede
export default async function AnfitriaoImoveisPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dbUser = await getCurrentDbUser()
  if (!dbUser) return null

  const [properties, origin] = await Promise.all([getAnfitriaoProperties(dbUser), getRequestOrigin()])

  return (
    <div className="font-display space-y-4 p-4 pt-6 text-[#0F172A]">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold">
          <Building2 className="h-5 w-5 text-[#1A56DB]" /> Imóveis
        </h1>
        <p className="text-sm text-[#64748B]">
          {properties.length} {properties.length === 1 ? 'imóvel vinculado' : 'imóveis vinculados'}
        </p>
      </div>

      {properties.length === 0 ? (
        <p className="rounded-3xl bg-white p-5 text-sm text-[#64748B] ring-1 ring-black/5">
          Você ainda não está vinculado a nenhum imóvel. Peça ao gestor para te vincular.
        </p>
      ) : (
        properties.map((p) => <PropertyGuideCard key={p.id} property={p} locale={locale} origin={origin} />)
      )}
    </div>
  )
}
