import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { History, Building2, Calendar, Check } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'

export default async function PrestadorHistoricoPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return null

  const completedTasks = await prisma.task.findMany({
    where: {
      assigneeId: dbUser.id,
      status: 'CONCLUIDA',
    },
    include: {
      property: { select: { name: true } },
    },
    orderBy: { completedAt: 'desc' },
    take: 50,
  })

  return (
    <div className="p-4 pt-6">
      <PageHeader
        title="Histórico"
        description={`${completedTasks.length} tarefa${completedTasks.length !== 1 ? 's' : ''} concluída${completedTasks.length !== 1 ? 's' : ''}`}
      />

      {completedTasks.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhuma tarefa concluída"
          description="Suas tarefas concluídas aparecerão aqui."
        />
      ) : (
        <div className="space-y-2">
          {completedTasks.map((task) => (
            <Card key={task.id} className="opacity-90">
              <CardContent className="py-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{task.title}</p>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {task.property.name}
                      </div>
                      {task.completedAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.completedAt)}
                        </div>
                      )}
                    </div>
                    {task.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.notes}</p>
                    )}
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
