import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { headers } from 'next/headers'
import { Wifi, Users, BookOpen, Link2 } from 'lucide-react'
import { getCurrentDbUser, listGuiaProperties } from '@/lib/guia-access'
import { getGuiaConfig } from '@/lib/actions/guia'
import { GuiaWifiForm } from '@/components/anfitriao/GuiaWifiForm'
import { GuiaPartners } from '@/components/anfitriao/GuiaPartners'
import { GuiaShareLink } from '@/components/anfitriao/GuiaShareLink'
import { cn } from '@/lib/utils'

export default async function AnfitriaoGuiaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ propertyId?: string }>
}) {
  const { locale } = await params
  const { propertyId } = await searchParams

  const dbUser = await getCurrentDbUser()
  if (!dbUser) return null

  const properties = await listGuiaProperties(dbUser)

  if (properties.length === 0) {
    return (
      <div className="p-4 pt-6 space-y-2">
        <h1 className="text-xl font-bold">Guia do Hóspede</h1>
        <p className="text-sm text-muted-foreground">Você ainda não está vinculado a nenhum imóvel.</p>
      </div>
    )
  }

  const selected = properties.find((p) => p.id === propertyId) ?? properties[0]
  const config = await getGuiaConfig(selected.id)
  if (!config) return null

  const { property, partners } = config

  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'staymet.somar.ia.br'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  const appUrl = `${proto}://${host}`

  return (
    <div className="p-4 pt-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-accent" /> Guia do Hóspede
        </h1>
        <p className="text-sm text-muted-foreground">O que o hóspede vê ao abrir o link da reserva</p>
      </div>

      {/* Seletor de imóvel */}
      {properties.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {properties.map((p) => (
            <Link
              key={p.id}
              href={`/${locale}/anfitriao/guia?propertyId=${p.id}`}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                p.id === selected.id ? 'bg-primary text-white border-primary' : 'bg-card text-foreground border-border hover:bg-muted',
              )}
            >
              {p.name}
            </Link>
          ))}
        </div>
      )}

      {/* Seção 1 — Wi-Fi e entregadores */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-accent" />
            <h2 className="font-semibold">Wi-Fi e Entregadores</h2>
          </div>
          <GuiaWifiForm
            key={property.id}
            propertyId={property.id}
            propertyName={property.name}
            wifiName={property.wifiName}
            wifiPassword={property.wifiPassword}
            deliveryInstructions={property.deliveryInstructions}
          />
        </CardContent>
      </Card>

      {/* Seção 2 — Contatos e locais */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            <h2 className="font-semibold">Contatos e Locais</h2>
          </div>
          <GuiaPartners
            key={property.id}
            propertyId={property.id}
            propertyName={property.name}
            defaultAddress={property.deliveryInstructions}
            partners={partners.map((p) => ({
              id: p.id,
              name: p.name,
              category: p.category,
              phone: p.phone,
              whatsappUrl: p.whatsappUrl,
              externalUrl: p.externalUrl,
              description: p.description,
              active: p.active,
              sortOrder: p.sortOrder,
              deliveryNote: p.deliveryNote,
            }))}
          />
        </CardContent>
      </Card>

      {/* Seção 3 — Link para o hóspede */}
      <Card className="border-accent/40">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-accent" />
            <h2 className="font-semibold">Link para o hóspede</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Envie este link ao hóspede. Ele abre direto no celular, sem login, com todos os botões acima.
          </p>
          <GuiaShareLink url={`${appUrl}/guia/${property.id}`} propertyName={property.name} />
        </CardContent>
      </Card>
    </div>
  )
}
