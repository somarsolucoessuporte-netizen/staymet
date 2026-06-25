import { Calendar, User, Home } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import { formatDate } from '@/lib/utils'

interface TaskCardProps {
  title: string
  type: string
  status: string
  propertyName?: string
  assigneeName?: string
  scheduledFor?: Date | string | null
  onClick?: () => void
}

const typeLabels: Record<string, string> = {
  LIMPEZA: 'Limpeza',
  MANUTENCAO: 'Manutenção',
  VISTORIA_ENTRADA: 'Vistoria Entrada',
  VISTORIA_SAIDA: 'Vistoria Saída',
  OUTRO: 'Outro',
}

const typeColors: Record<string, string> = {
  LIMPEZA: 'bg-blue-100 text-blue-700',
  MANUTENCAO: 'bg-orange-100 text-orange-700',
  VISTORIA_ENTRADA: 'bg-green-100 text-green-700',
  VISTORIA_SAIDA: 'bg-purple-100 text-purple-700',
  OUTRO: 'bg-gray-100 text-gray-700',
}

export function TaskCard({
  title,
  type,
  status,
  propertyName,
  assigneeName,
  scheduledFor,
  onClick,
}: TaskCardProps) {
  return (
    <Card
      className={`overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]' : ''}`}
      onClick={onClick}
    >
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[type] ?? 'bg-gray-100 text-gray-700'}`}>
                {typeLabels[type] ?? type}
              </span>
            </div>
            <h3 className="font-medium text-sm text-foreground leading-tight truncate">{title}</h3>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
          {propertyName && (
            <div className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              <span className="truncate max-w-[120px]">{propertyName}</span>
            </div>
          )}
          {assigneeName && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{assigneeName}</span>
            </div>
          )}
          {scheduledFor && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(scheduledFor)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
