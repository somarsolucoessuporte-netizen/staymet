import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  MapPin, Users, Wifi, Clock, Calendar, CheckSquare, AlertTriangle,
  Package, Wrench, Home,
} from 'lucide-react'
import Link from 'next/link'

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params

  if (id === 'new') {
    return <NewPropertyForm locale={locale} />
  }

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true, email: true } },
      reservations: {
        where: { status: { in: ['CONFIRMADA', 'EM_ANDAMENTO'] } },
        orderBy: { checkIn: 'asc' },
        take: 5,
      },
      tasks: {
        where: { status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } },
        include: { assignee: { select: { name: true } } },
        orderBy: { scheduledFor: 'asc' },
        take: 5,
      },
      inventory: { orderBy: { name: 'asc' } },
      partners: {
        include: { partner: true },
      },
      occurrences: {
        where: { status: { in: ['ABERTA', 'EM_ANDAMENTO'] } },
        take: 3,
      },
    },
  })

  if (!property) notFound()

  const typeLabels: Record<string, string> = {
    CASA_PRAIA: 'Casa de Praia',
    APARTAMENTO: 'Apartamento',
    CHACARA: 'Chácara',
    CASA_SERRA: 'Casa de Serra',
    OUTRO: 'Outro',
  }

  return (
    <div className="p-4 pt-6 space-y-5">
      <PageHeader
        title={property.name}
        description={typeLabels[property.type] ?? property.type}
      />

      {/* Cover */}
      <div className="h-48 rounded-xl bg-gradient-to-br from-primary-800 to-primary-600 flex items-center justify-center overflow-hidden">
        {property.coverImageUrl ? (
          <img src={property.coverImageUrl} alt={property.name} className="w-full h-full object-cover" />
        ) : (
          <Home className="h-16 w-16 text-white/20" />
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-3">
            <MapPin className="h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-sm font-medium">{property.city}</p>
            <p className="text-xs text-muted-foreground">{property.state}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3">
            <Users className="h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-sm font-medium">{property.maxGuests} hóspedes</p>
            <p className="text-xs text-muted-foreground">capacidade máx.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3">
            <Clock className="h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-sm font-medium">Check-in {property.checkInTime}</p>
            <p className="text-xs text-muted-foreground">Check-out {property.checkOutTime}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3">
            <Wifi className="h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-sm font-medium truncate">{property.wifiName ?? 'Não cadastrado'}</p>
            <p className="text-xs text-muted-foreground">{property.wifiPassword ?? '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Reservas ativas */}
      {property.reservations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-accent" />
            <h2 className="font-semibold">Reservas Ativas</h2>
          </div>
          <div className="space-y-2">
            {property.reservations.map((res) => (
              <Card key={res.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{res.guestName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(res.checkIn)} → {formatDate(res.checkOut)}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={res.status} />
                      {res.totalAmount && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(Number(res.totalAmount))}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tarefas pendentes */}
      {property.tasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare className="h-4 w-4 text-blue-600" />
            <h2 className="font-semibold">Tarefas Pendentes</h2>
          </div>
          <div className="space-y-2">
            {property.tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      {task.assignee && (
                        <p className="text-xs text-muted-foreground">{task.assignee.name}</p>
                      )}
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Ocorrências */}
      {property.occurrences.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <h2 className="font-semibold">Ocorrências Abertas</h2>
          </div>
          <div className="space-y-2">
            {property.occurrences.map((occ) => (
              <Card key={occ.id} className="border-l-4 border-l-danger">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{occ.title}</p>
                    <StatusBadge status={occ.priority} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{occ.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Inventário */}
      {property.inventory.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Inventário</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {property.inventory.map((item) => (
              <Card key={item.id}>
                <CardContent className="py-2.5">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qtd: {item.quantity} • {item.condition}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Parceiros */}
      {property.partners.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Parceiros</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {property.partners.map((pp) => (
              <Card key={pp.partnerId}>
                <CardContent className="py-2.5">
                  <p className="font-medium text-sm">{pp.partner.name}</p>
                  <p className="text-xs text-muted-foreground">{pp.partner.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NewPropertyForm({ locale }: { locale: string }) {
  return (
    <div className="p-4 pt-6">
      <PageHeader title="Novo Imóvel" />
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center py-8">
            Formulário de criação de imóvel — conecte ao Supabase para salvar dados.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
