import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function AnfitriaoOcorrenciasPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const occurrences = await prisma.occurrence.findMany({
    include: {
      property: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-4 pt-6">
      <PageHeader title="Ocorrências" description={`${occurrences.length} registros`} />

      {occurrences.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="Sem ocorrências" description="Nenhuma ocorrência registrada." />
      ) : (
        <div className="space-y-3">
          {occurrences.map((occ) => (
            <Card key={occ.id} className={`border-l-4 ${occ.status === 'RESOLVIDA' ? 'border-l-success opacity-70' : 'border-l-danger'}`}>
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{occ.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{occ.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{occ.property.name} • {formatDate(occ.createdAt)}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <StatusBadge status={occ.status} />
                    <StatusBadge status={occ.priority} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
