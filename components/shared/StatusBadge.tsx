import { Badge } from '@/components/ui/badge'

type StatusType =
  | 'CONFIRMADA' | 'EM_ANDAMENTO' | 'ENCERRADA' | 'CANCELADA'
  | 'PENDENTE' | 'CONCLUIDA'
  | 'ABERTA' | 'RESOLVIDA'
  | 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'

const statusConfig: Record<StatusType, { label: string; variant: 'default' | 'accent' | 'success' | 'danger' | 'warning' | 'muted' | 'outline' }> = {
  CONFIRMADA: { label: 'Confirmada', variant: 'accent' },
  EM_ANDAMENTO: { label: 'Em andamento', variant: 'default' },
  ENCERRADA: { label: 'Encerrada', variant: 'muted' },
  CANCELADA: { label: 'Cancelada', variant: 'danger' },
  PENDENTE: { label: 'Pendente', variant: 'warning' },
  CONCLUIDA: { label: 'Concluída', variant: 'success' },
  ABERTA: { label: 'Aberta', variant: 'danger' },
  RESOLVIDA: { label: 'Resolvida', variant: 'success' },
  BAIXA: { label: 'Baixa', variant: 'muted' },
  MEDIA: { label: 'Média', variant: 'warning' },
  ALTA: { label: 'Alta', variant: 'danger' },
  URGENTE: { label: 'Urgente', variant: 'danger' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as StatusType] ?? { label: status, variant: 'outline' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
