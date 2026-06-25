import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, TrendingUp } from 'lucide-react'

export default async function ProprietarioRelatoriosPage({
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

  const properties = await prisma.property.findMany({
    where: { ownerId: dbUser.id },
    include: {
      reservations: {
        where: { status: { not: 'CANCELADA' } },
        orderBy: { checkIn: 'desc' },
        take: 20,
      },
    },
  })

  return (
    <div className="p-4 pt-6 space-y-6">
      <PageHeader title="Relatórios" />

      {properties.map((prop) => {
        const total = prop.reservations.reduce((s, r) => s + Number(r.totalAmount ?? 0), 0)
        return (
          <Card key={prop.id}>
            <CardHeader>
              <CardTitle className="text-sm">{prop.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-accent" />
                <span className="text-2xl font-black text-accent">{formatCurrency(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{prop.reservations.length} reservas</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
