import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getOwnerOptions } from '@/lib/admin-properties'
import { PropertyForm } from '@/components/admin/PropertyForm'

export default async function NovoImovelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const owners = await getOwnerOptions()

  return (
    <div className="font-display min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <Link href={`/${locale}/admin/imoveis`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#1A56DB]">
          <ArrowLeft size={16} /> Imóveis
        </Link>
        <h1 className="mb-5 text-2xl font-extrabold">Novo imóvel</h1>
        <PropertyForm locale={locale} owners={owners} />
      </div>
    </div>
  )
}
