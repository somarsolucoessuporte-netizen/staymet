import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { TaskCard } from '@/components/shared/TaskCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { CheckSquare } from 'lucide-react'

const statusGroups = [
  { key: 'PENDENTE', label: 'Pendente', color: 'text-warning' },
  { key: 'EM_ANDAMENTO', label: 'Em Andamento', color: 'text-blue-600' },
  { key: 'CONCLUIDA', label: 'Concluída', color: 'text-success' },
]

export default async function GestorTarefasPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const tasks = await prisma.task.findMany({
    where: { status: { not: 'CANCELADA' } },
    include: {
      property: { select: { name: true } },
      assignee: { select: { name: true } },
    },
    orderBy: { scheduledFor: 'asc' },
  })

  const grouped = statusGroups.map((group) => ({
    ...group,
    tasks: tasks.filter((t) => t.status === group.key),
  }))

  return (
    <div className="p-4 pt-6">
      <PageHeader
        title="Tarefas"
        description={`${tasks.length} tarefas no total`}
      />

      {tasks.length === 0 ? (
        <EmptyState icon={CheckSquare} title="Sem tarefas" description="Nenhuma tarefa cadastrada." />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.key}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-2 w-2 rounded-full ${
                  group.key === 'PENDENTE' ? 'bg-warning' :
                  group.key === 'EM_ANDAMENTO' ? 'bg-blue-600' : 'bg-success'
                }`} />
                <h2 className={`font-semibold text-sm ${group.color}`}>
                  {group.label} ({group.tasks.length})
                </h2>
              </div>
              {group.tasks.length === 0 ? (
                <Card>
                  <CardContent className="py-4 text-center text-sm text-muted-foreground">
                    Nenhuma tarefa
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {group.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      title={task.title}
                      type={task.type}
                      status={task.status}
                      propertyName={task.property.name}
                      assigneeName={task.assignee?.name}
                      scheduledFor={task.scheduledFor}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
