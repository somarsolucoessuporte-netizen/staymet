import { prisma } from '@/lib/prisma'
import { CheckSquare, ClipboardList, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { TaskLinkButton } from '@/components/gestor/TaskLinkButton'

const typeLabels: Record<string, string> = {
  LIMPEZA: 'Limpeza',
  MANUTENCAO: 'Manutenção',
  VISTORIA_ENTRADA: 'Vistoria Entrada',
  VISTORIA_SAIDA: 'Vistoria Saída',
  OUTRO: 'Outro',
}

const columns = [
  {
    key: 'PENDENTE',
    label: 'Pendente',
    icon: AlertCircle,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
    dot: 'bg-amber-400',
    badge: 'bg-amber-100 text-amber-700',
  },
  {
    key: 'EM_ANDAMENTO',
    label: 'Em andamento',
    icon: ClipboardList,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    key: 'CONCLUIDA',
    label: 'Concluída',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
  },
]

export default async function GestorTarefasPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params

  const tasks = await prisma.task.findMany({
    where: { status: { not: 'CANCELADA' } },
    include: {
      property: { select: { name: true } },
      assignee: { select: { name: true, phone: true } },
    },
    orderBy: { scheduledFor: 'asc' },
  })

  const grouped = columns.map((col) => ({
    ...col,
    tasks: tasks.filter((t) => t.status === col.key),
  }))

  return (
    <div className="p-5 lg:p-8 pb-24 lg:pb-8">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Tarefas
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} no total</p>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckSquare size={24} className="text-emerald-500" />
          </div>
          <p className="font-semibold text-gray-800">Nenhuma tarefa</p>
          <p className="text-sm text-gray-400 mt-1">Nenhuma tarefa cadastrada no momento.</p>
        </div>
      ) : (
        <>
          {/* Mobile: lista por seção */}
          <div className="lg:hidden space-y-6">
            {grouped.map((col) => {
              const ColIcon = col.icon
              return (
                <section key={col.key}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={`w-7 h-7 ${col.iconBg} rounded-lg flex items-center justify-center`}>
                      <ColIcon size={14} className={col.iconColor} />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-700">{col.label}</h2>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${col.badge}`}>
                      {col.tasks.length}
                    </span>
                  </div>
                  {col.tasks.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 py-5 text-center">
                      <p className="text-sm text-gray-400">Nenhuma tarefa</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {col.tasks.map((task) => (
                        <KanbanCard key={task.id} task={task} dot={col.dot} />
                      ))}
                    </div>
                  )}
                </section>
              )
            })}
          </div>

          {/* Desktop: 3 colunas */}
          <div className="hidden lg:grid grid-cols-3 gap-4">
            {grouped.map((col) => {
              const ColIcon = col.icon
              return (
                <div key={col.key} className="flex flex-col gap-3">
                  <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl ${col.iconBg}`}>
                    <div className="w-7 h-7 bg-white/60 rounded-lg flex items-center justify-center">
                      <ColIcon size={14} className={col.iconColor} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                    <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                      {col.tasks.length}
                    </span>
                  </div>
                  {col.tasks.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-8 text-center">
                      <p className="text-sm text-gray-400">Vazio</p>
                    </div>
                  ) : (
                    col.tasks.map((task) => (
                      <KanbanCard key={task.id} task={task} dot={col.dot} />
                    ))
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function KanbanCard({
  task,
  dot,
}: {
  task: {
    id: string
    title: string
    description: string | null
    type: string
    status: string
    scheduledFor: Date | null
    property: { name: string }
    assignee: { name: string; phone: string | null } | null
  }
  dot: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 font-medium mb-0.5">
            {typeLabels[task.type] ?? task.type}
          </p>
          <p className="text-sm font-semibold text-gray-900 leading-tight">{task.title}</p>
        </div>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${dot}`} />
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 leading-relaxed mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-400 mb-2">
        <span className="font-medium text-gray-600">{task.property.name}</span>
        {task.assignee && <span>· {task.assignee.name}</span>}
        {task.scheduledFor && <span>· {formatDate(task.scheduledFor)}</span>}
      </div>

      {/* Botão de link WhatsApp — apenas para tarefas não concluídas */}
      {task.status !== 'CONCLUIDA' && (
        <TaskLinkButton
          taskId={task.id}
          assigneeName={task.assignee?.name}
          assigneePhone={task.assignee?.phone}
        />
      )}
    </div>
  )
}
