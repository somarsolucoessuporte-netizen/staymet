import { OccurrenceDetailView } from '@/components/ocorrencias/OccurrenceDetailView'

export default async function OcorrenciaDetalhePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  return <OccurrenceDetailView id={id} basePath={`/${locale}/anfitriao/ocorrencias`} />
}
