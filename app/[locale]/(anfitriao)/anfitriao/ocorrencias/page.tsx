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
  return <OccurrencesView basePath={`/${locale}/anfitriao/ocorrencias`} search={search} />
}
