import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Building2, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function GestorOcorrenciasPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const occurrences = await prisma.occurrence.findMany({
    include: {
      property: { select: { name: true } },
      reportedBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const open = occurrences.filter((o) => o.status !== 'RESOLVIDA')
  const resolved = occurrences.filter((o) => o.status === 'RESOLVIDA')

  const priorityColor: Record<string, string> = {
    BAIXA: 'border-l-muted-foreground',
    MEDIA: 'border-l-warning',
    ALTA: 'border-l-danger',
    URGENTE: 'border-l-danger',
  }

  return (
    <div className="p-4 pt-6 space-y-6">
      <PageHeader
        title="Ocorrências"
        description={`${open.length} em aberto, ${resolved.length} resolvida${resolved.length !== 1 ? 's' : ''}`}
      />

      {occurrences.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="Nenhuma ocorrência"
          description="Tudo certo! Nenhuma ocorrência registrada."
        />
      ) : (
        <>
          {open.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm text-danger mb-3">Em aberto ({open.length})</h2>
              <div className="space-y-2">
                {open.map((occ) => (
                  <Card key={occ.id} className={`border-l-4 ${priorityColor[occ.priority] ?? 'border-l-border'}`}>
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{occ.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{occ.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {occ.property.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {occ.reportedBy.name}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <StatusBadge status={occ.status} />
                          <StatusBadge status={occ.priority} />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground/60 mt-2">{formatDate(occ.createdAt)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {resolved.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm text-success mb-3">Resolvidas ({resolved.length})</h2>
              <div className="space-y-2">
                {resolved.slice(0, 5).map((occ) => (
                  <Card key={occ.id} className="opacity-70">
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{occ.title}</p>
                        <StatusBadge status="RESOLVIDA" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{occ.property.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
