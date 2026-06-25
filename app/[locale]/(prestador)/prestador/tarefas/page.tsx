import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { CheckSquare, Building2, Calendar, Wrench, ClipboardCheck, Sparkles } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { PrestadorTaskActions } from './PrestadorTaskActions'

const typeConfig: Record<string, { label: string; icon: typeof CheckSquare; color: string; bg: string }> = {
  LIMPEZA: { label: 'Limpeza', icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50' },
  MANUTENCAO: { label: 'Manutenção', icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50' },
  VISTORIA_ENTRADA: { label: 'Vistoria Entrada', icon: ClipboardCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  VISTORIA_SAIDA: { label: 'Vistoria Saída', icon: ClipboardCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
  OUTRO: { label: 'Outro', icon: CheckSquare, color: 'text-gray-600', bg: 'bg-gray-100' },
}

const statusConfig: Record<string, { label: string; ring: string; dot: string }> = {
  PENDENTE: { label: 'Pendente', ring: 'border-amber-300 bg-amber-50', dot: 'bg-amber-400' },
  EM_ANDAMENTO: { label: 'Em andamento', ring: 'border-blue-300 bg-blue-50', dot: 'bg-blue-500' },
}

export default async function PrestadorTarefasPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return null

  const firstName = dbUser.name.split(' ')[0]

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

  const pendentes = tasks.filter((t) => t.status === 'PENDENTE')
  const emAndamento = tasks.filter((t) => t.status === 'EM_ANDAMENTO')

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Header escuro */}
      <div className="bg-[#0F172A] px-5 pt-10 pb-8">
        <p className="text-white/40 text-xs font-medium mb-1">Olá, {firstName}</p>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Minhas Tarefas
        </h1>
        <p className="text-white/50 text-sm mt-1">
          {tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} atribuída{tasks.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {tasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="font-semibold text-gray-800 mb-1">Tudo em dia!</p>
            <p className="text-sm text-gray-400">Nenhuma tarefa atribuída no momento.</p>
          </div>
        ) : (
          <>
            {/* Em andamento */}
            {emAndamento.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Em andamento ({emAndamento.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {emAndamento.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </section>
            )}

            {/* Pendentes */}
            {pendentes.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Pendentes ({pendentes.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {pendentes.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TaskCard({ task }: {
  task: {
    id: string
    title: string
    description: string | null
    type: string
    status: string
    scheduledFor: Date | null
    property: { name: string; city: string }
  }
}) {
  const type = typeConfig[task.type] ?? typeConfig.OUTRO
  const status = statusConfig[task.status]
  const TypeIcon = type.icon

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${status?.ring ?? 'border-gray-100'}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl ${type.bg} flex items-center justify-center flex-shrink-0`}>
            <TypeIcon size={16} className={type.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-gray-400 mb-0.5">{type.label}</p>
                <p className="text-sm font-semibold text-gray-900 leading-tight">{task.title}</p>
              </div>
              {status && (
                <span className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  <span className="text-[11px] text-gray-500 font-medium">{status.label}</span>
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{task.description}</p>
            )}

            <div className="flex flex-wrap gap-3 mt-2.5 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Building2 size={11} />
                {task.property.name}
              </span>
              {task.scheduledFor && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {formatDate(task.scheduledFor)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-50 px-4 py-3">
        <PrestadorTaskActions taskId={task.id} status={task.status} />
      </div>
    </div>
  )
}
