import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Mail, Phone } from 'lucide-react'
import { getRoleName } from '@/lib/utils'

export default async function GestorEquipePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })

  const roleOrder = ['GESTOR', 'PROPRIETARIO', 'ANFITRIAO', 'PRESTADOR', 'HOSPEDE']
  const grouped = roleOrder.map((role) => ({
    role,
    label: getRoleName(role),
    users: users.filter((u) => u.role === role),
  })).filter((g) => g.users.length > 0)

  const roleColors: Record<string, string> = {
    GESTOR: 'bg-primary text-white',
    PROPRIETARIO: 'bg-accent text-primary',
    ANFITRIAO: 'bg-blue-100 text-blue-700',
    PRESTADOR: 'bg-purple-100 text-purple-700',
    HOSPEDE: 'bg-green-100 text-green-700',
  }

  return (
    <div className="p-4 pt-6 space-y-6">
      <PageHeader
        title="Equipe"
        description={`${users.length} usuário${users.length !== 1 ? 's' : ''} cadastrado${users.length !== 1 ? 's' : ''}`}
      />

      {users.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum usuário" description="Nenhum usuário cadastrado." />
      ) : (
        grouped.map((group) => (
          <div key={group.role}>
            <h2 className="font-semibold text-sm text-muted-foreground mb-3">
              {group.label} ({group.users.length})
            </h2>
            <div className="space-y-2">
              {group.users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${roleColors[user.role] ?? 'bg-muted text-muted-foreground'}`}>
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{user.name}</p>
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${roleColors[user.role] ?? 'bg-muted text-muted-foreground'}`}>
                        {group.label}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
