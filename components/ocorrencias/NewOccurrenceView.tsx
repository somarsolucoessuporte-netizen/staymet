import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCurrentDbUser } from '@/lib/guia-access'
import { listContributableProperties } from '@/lib/occurrence-access'
import { NewOccurrenceForm } from '@/components/ocorrencias/NewOccurrenceForm'

/** "+ Nova ocorrência" — imóveis onde o usuário pode registrar */
export async function NewOccurrenceView({ basePath }: { basePath: string }) {
  const user = await getCurrentDbUser()
  const properties = user ? await listContributableProperties(user) : []

  return (
    <div className="font-display space-y-4 p-4 pt-6 text-[#0F172A]">
      <Link href={basePath} className="inline-flex items-center gap-1.5 text-sm text-[#64748B]">
        <ArrowLeft size={16} /> Ocorrências
      </Link>
      <h1 className="text-xl font-extrabold">Nova ocorrência</h1>
      {properties.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-sm text-[#64748B] ring-1 ring-black/5">
          Você não tem imóveis vinculados para registrar ocorrências.
        </p>
      ) : (
        <NewOccurrenceForm basePath={basePath} properties={properties} />
      )}
    </div>
  )
}
