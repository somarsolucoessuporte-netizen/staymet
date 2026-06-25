import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { CheckSquare, Building2, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { PrestadorTaskActions } from './PrestadorTaskActions'

export default async function PrestadorTarefasPage({
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

  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: dbUser.id,
      status: { in: ['PENDENTE', 'EM_ANDAMENTO'] },
    },
    include: {
      property: { select: { name: true, city: true } },
    },
    orderBy: { scheduledFor: 'asc' },
  })

  const typeLabels: Record<string, string> = {
    LIMPEZA: '🧹 Limpeza',
    MANUTENCAO: '🔧 Manutenção',
    VISTORIA_ENTRADA: '📋 Vistoria Entrada',
    VISTORIA_SAIDA: '📋 Vistoria Saída',
    OUTRO: '✨ Outro',
  }

  return (
    <div className="p-4 pt-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold">Minhas Tarefas</h1>
        <p className="text-sm text-muted-foreground">
          {tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} pendente{tasks.length !== 1 ? 's' : ''}
        </p>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Sem tarefas"
          description="Nenhuma tarefa atribuída no momento. Bom descanso!"
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground">
                      {typeLabels[task.type] ?? task.type}
                    </span>
                    <h3 className="font-semibold text-sm mt-0.5">{task.title}</h3>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                    )}
                  </div>
                  <StatusBadge status={task.status} />
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    <span>{task.property.name} — {task.property.city}</span>
                  </div>
                  {task.scheduledFor && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(task.scheduledFor)}</span>
                    </div>
                  )}
                </div>

                <PrestadorTaskActions taskId={task.id} status={task.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
