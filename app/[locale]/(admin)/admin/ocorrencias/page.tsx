import { OccurrencesView, type OccurrencesSearch } from '@/components/ocorrencias/OccurrencesView'

export default async function OcorrenciasPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<OccurrencesSearch>
}) {
  const { locale } = await params
  const search = await searchParams
  return (<div className="min-h-screen bg-[#F8FAFC]"><div className="mx-auto max-w-2xl"><OccurrencesView basePath={`/${locale}/admin/ocorrencias`} search={search} /></div></div>)
}
