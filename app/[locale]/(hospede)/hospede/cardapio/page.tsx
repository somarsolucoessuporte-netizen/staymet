import { Card, CardContent } from '@/components/ui/card'
import { Phone, ExternalLink, Utensils } from 'lucide-react'

async function getPartnersFromCode(code?: string) {
  if (!code) return []
  const { prisma } = await import('@/lib/prisma')
  const res = await prisma.reservation.findUnique({
    where: { accessCode: code },
    include: {
      property: {
        include: {
          partners: { include: { partner: true } },
        },
      },
    },
  })
  return res?.property?.partners?.map((pp) => pp.partner) ?? []
}

export default async function GuestCardapioPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  const partners = await getPartnersFromCode(code)

  const categoryLabels: Record<string, string> = {
    LIMPEZA: '🧹 Limpeza',
    MANUTENCAO: '🔧 Manutenção',
    DELIVERY: '🛵 Delivery',
    PASSEIO: '🏖️ Passeio',
    OUTRO: '✨ Outro',
  }

  const foodPartners = partners.filter((p) => ['DELIVERY', 'OUTRO'].includes(p.category))

  return (
    <div className="p-4 pt-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold">Cardápio Local</h1>
        <p className="text-sm text-muted-foreground">Opções recomendadas pelo anfitrião</p>
      </div>

      {partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Utensils className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold">Nenhuma recomendação</p>
          <p className="text-sm text-muted-foreground mt-1">O anfitrião ainda não adicionou indicações.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map((partner) => (
            <Card key={partner.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{partner.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {categoryLabels[partner.category] ?? partner.category}
                    </p>
                    {partner.description && (
                      <p className="text-sm text-foreground mt-1">{partner.description}</p>
                    )}
                  </div>
                </div>
                {partner.phone && (
                  <a
                    href={`tel:${partner.phone}`}
                    className="flex items-center gap-2 mt-3 text-sm text-accent font-medium"
                  >
                    <Phone className="h-4 w-4" />
                    {partner.phone}
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
