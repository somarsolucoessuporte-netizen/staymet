import { Card, CardContent } from '@/components/ui/card'
import { Phone, ExternalLink, Utensils, MessageCircle, Compass, ShoppingCart } from 'lucide-react'
import type { Partner } from '@prisma/client'
import { getCategoryMeta } from '@/lib/guia'

async function getPartnersFromCode(code?: string) {
  if (!code) return []
  const { prisma } = await import('@/lib/prisma')
  const res = await prisma.reservation.findUnique({
    where: { accessCode: code },
    include: {
      property: {
        include: {
          partners: {
            include: { partner: true },
            orderBy: [{ partner: { sortOrder: 'asc' } }, { partner: { name: 'asc' } }],
          },
        },
      },
    },
  })
  return res?.property?.partners?.map((pp) => pp.partner).filter((p) => p.active) ?? []
}


// LIMPEZA / MANUTENCAO são parceiros operacionais e não aparecem para o hóspede
const sections = [
  { id: 'refeicoes', title: 'Refeições',        categories: ['DELIVERY', 'RESTAURANTE', 'OUTRO'], Icon: Utensils },
  { id: 'roteiros',  title: 'Roteiros & Dicas', categories: ['PASSEIO'],                          Icon: Compass },
  { id: 'mercado',   title: 'Mercado',          categories: ['MERCADO'],                          Icon: ShoppingCart },
]

function PartnerCard({ partner }: { partner: Partner }) {
  const isPlace = partner.category === 'PASSEIO' || partner.category === 'RESTAURANTE' || partner.category === 'MERCADO'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-4">
        <p className="font-semibold">{partner.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {getCategoryMeta(partner.category)?.label ?? partner.category}
        </p>
        {partner.description && (
          <p className="text-sm text-foreground mt-1">{partner.description}</p>
        )}

        {(partner.whatsappUrl || partner.phone || partner.externalUrl) && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {partner.whatsappUrl ? (
              <a
                href={partner.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            ) : partner.phone ? (
              <a
                href={`tel:${partner.phone}`}
                className="inline-flex items-center gap-2 text-sm text-accent font-medium"
              >
                <Phone className="h-4 w-4" />
                {partner.phone}
              </a>
            ) : null}

            {partner.externalUrl && (
              <a
                href={partner.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                {isPlace ? 'Ver no mapa' : 'Ver mais'}
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
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

  const grouped = sections
    .map((section) => ({
      ...section,
      partners: partners.filter((p) => section.categories.includes(p.category)),
    }))
    .filter((section) => section.partners.length > 0)

  return (
    <div className="p-4 pt-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold">Comida, Roteiros & Dicas</h1>
        <p className="text-sm text-muted-foreground">Opções recomendadas pelo anfitrião</p>
      </div>

      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Utensils className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold">Nenhuma recomendação</p>
          <p className="text-sm text-muted-foreground mt-1">O anfitrião ainda não adicionou indicações.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((section) => (
            <section key={section.id} id={section.id} className="space-y-3 scroll-mt-4">
              <div className="flex items-center gap-2">
                <section.Icon className="h-4 w-4 text-accent" />
                <h2 className="text-base font-semibold">{section.title}</h2>
              </div>
              {section.partners.map((partner) => (
                <PartnerCard key={partner.id} partner={partner} />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
