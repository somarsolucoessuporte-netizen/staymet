import { Home, MapPin, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface PropertyCardProps {
  id: string
  name: string
  city: string
  state: string
  type: string
  maxGuests: number
  active: boolean
  coverImageUrl?: string | null
  href?: string
  stats?: {
    activeReservations?: number
    pendingTasks?: number
  }
}

const typeLabels: Record<string, string> = {
  CASA_PRAIA: 'Casa de Praia',
  APARTAMENTO: 'Apartamento',
  CHACARA: 'Chácara',
  CASA_SERRA: 'Casa de Serra',
  OUTRO: 'Outro',
}

export function PropertyCard({
  id,
  name,
  city,
  state,
  type,
  maxGuests,
  active,
  coverImageUrl,
  href,
  stats,
}: PropertyCardProps) {
  const content = (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-36 bg-gradient-to-br from-primary-800 to-primary-600 flex items-center justify-center relative">
        {coverImageUrl ? (
          <img src={coverImageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <Home className="h-12 w-12 text-white/30" />
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={active ? 'success' : 'muted'}>{active ? 'Ativo' : 'Inativo'}</Badge>
        </div>
      </div>
      <CardContent className="pt-3">
        <h3 className="font-semibold text-foreground text-sm leading-tight">{name}</h3>
        <div className="flex items-center gap-1 mt-1 text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="text-xs">{city}, {state}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">{typeLabels[type] ?? type}</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{maxGuests}</span>
          </div>
        </div>
        {stats && (
          <div className="flex gap-3 mt-3 pt-3 border-t border-border">
            {stats.activeReservations !== undefined && (
              <div className="text-center">
                <div className="text-sm font-bold text-accent">{stats.activeReservations}</div>
                <div className="text-xs text-muted-foreground">Reservas</div>
              </div>
            )}
            {stats.pendingTasks !== undefined && (
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">{stats.pendingTasks}</div>
                <div className="text-xs text-muted-foreground">Tarefas</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
