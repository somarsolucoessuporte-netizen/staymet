import { OccurrenceDetailView } from '@/components/ocorrencias/OccurrenceDetailView'

export default async function OcorrenciaDetalhePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  return (<div className="min-h-screen bg-[#F8FAFC]"><div className="mx-auto max-w-2xl"><OccurrenceDetailView id={id} basePath={`/${locale}/admin/ocorrencias`} /></div></div>)
}
