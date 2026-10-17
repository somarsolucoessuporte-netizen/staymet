import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Wifi, Users, Eye, BookOpen, ArrowRight } from 'lucide-react'
import { getCurrentDbUser, listGuiaProperties } from '@/lib/guia-access'
import { getGuiaConfig } from '@/lib/actions/guia'
import { GuiaWifiForm } from '@/components/anfitriao/GuiaWifiForm'
import { GuiaPartners } from '@/components/anfitriao/GuiaPartners'
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

  const { property, partners, previewAccessCode } = config

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
            partners={partners.map((p) => ({
              id: p.id,
              name: p.name,
              category: p.category,
              phone: p.phone,
              whatsappUrl: p.whatsappUrl,
              externalUrl: p.externalUrl,
              description: p.description,
            }))}
          />
        </CardContent>
      </Card>

      {/* Seção 3 — Preview */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-accent" />
            <h2 className="font-semibold">Preview</h2>
          </div>
          {previewAccessCode ? (
            <a
              href={`/${locale}/hospede/boas-vindas?code=${previewAccessCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-primary hover:bg-accent-600 transition-colors"
            >
              Ver como o hóspede vê <ArrowRight className="h-4 w-4" />
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">Crie uma reserva para visualizar o guia.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
