import { NewOccurrenceView } from '@/components/ocorrencias/NewOccurrenceView'

export default async function NovaOcorrenciaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <NewOccurrenceView basePath={`/${locale}/anfitriao/ocorrencias`} />
}
