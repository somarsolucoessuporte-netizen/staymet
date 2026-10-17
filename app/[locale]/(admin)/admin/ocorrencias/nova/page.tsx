import { NewOccurrenceView } from '@/components/ocorrencias/NewOccurrenceView'

export default async function NovaOcorrenciaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (<div className="min-h-screen bg-[#F8FAFC]"><div className="mx-auto max-w-2xl"><NewOccurrenceView basePath={`/${locale}/admin/ocorrencias`} /></div></div>)
}
