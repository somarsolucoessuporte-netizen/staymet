import Link from 'next/link'
import QRCode from 'qrcode'
import { Card, CardContent } from '@/components/ui/card'
import { Wifi, Users, BookOpen, Link2, ImageIcon, QrCode, Download, MapPin } from 'lucide-react'
import { getCurrentDbUser, listGuiaProperties } from '@/lib/guia-access'
import { getGuiaConfig } from '@/lib/actions/guia'
import { getRequestOrigin } from '@/lib/request-origin'
import { slugify } from '@/lib/slug'
import { GuiaWifiForm } from '@/components/anfitriao/GuiaWifiForm'
import { GuiaPartners } from '@/components/anfitriao/GuiaPartners'
import { GuiaShareLink } from '@/components/anfitriao/GuiaShareLink'
import { GuiaSlugForm } from '@/components/anfitriao/GuiaSlugForm'
import { GuiaPlaceForm } from '@/components/anfitriao/GuiaPlaceForm'
import { GuiaLocationForm } from '@/components/anfitriao/GuiaLocationForm'
import { googleMapsPointUrl, propertyPoint } from '@/lib/geo'
import { geocodeCity } from '@/lib/geocode'
import { GuiaSuggestionsToggle } from '@/components/anfitriao/GuiaSuggestionsToggle'
import { cn } from '@/lib/utils'
import { ChartLineUp } from '@phosphor-icons/react/ssr'

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
  const origin = await getRequestOrigin()
  // Link amigável quando houver slug; o /guia/{id} continua valendo
  const guideUrl = property.slug ? `${origin}/g/${property.slug}` : `${origin}/guia/${property.id}`
  const qrOptions = { margin: 1, color: { dark: '#0F172A', light: '#FFFFFF' } }
  const savedPoint = propertyPoint(property)
  const mapsUrl = savedPoint ? googleMapsPointUrl(savedPoint) : null
  const [qrSvg, qrPng, cityCenter] = await Promise.all([
    QRCode.toString(guideUrl, { ...qrOptions, type: 'svg' }),
    QRCode.toDataURL(guideUrl, { ...qrOptions, width: 1024 }),
    // Sem ponto salvo, o mapa abre na cidade do imóvel
    savedPoint ? null : geocodeCity(property.city, property.state),
  ])

  return (
    <div className="p-4 pt-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" /> Guia do Hóspede
          </h1>
          <p className="text-sm text-muted-foreground">O que o hóspede vê ao abrir o link</p>
        </div>
        <Link
          href={`/${locale}/anfitriao/guia/relatorio?propertyId=${selected.id}`}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[#F1F5FF] px-3 text-xs font-semibold text-[#1A56DB] transition active:scale-[0.97]"
        >
          <ChartLineUp size={16} weight="duotone" /> Relatório de uso
        </Link>
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

      {/* 1 — Link do guia (topo): copiar/enviar/abrir, link amigável e QR Code */}
      <Card className="border-accent/40">
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-accent" />
            <h2 className="font-semibold">Link do guia</h2>
          </div>
          <GuiaShareLink url={guideUrl} propertyName={property.name} />
          <GuiaSlugForm
            key={`${property.id}-${property.slug ?? ''}`}
            propertyId={property.id}
            slug={property.slug}
            suggestion={slugify(property.name)}
            origin={origin}
          />
          <div className="flex items-center gap-4 rounded-2xl bg-[#F8FAFC] p-3 ring-1 ring-black/5">
            <div
              className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-white p-1.5 ring-1 ring-black/5 [&>svg]:h-full [&>svg]:w-full"
              aria-label={`QR Code do guia: ${guideUrl}`}
              role="img"
              // SVG gerado no servidor pela biblioteca qrcode a partir da URL do guia
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <div className="min-w-0 space-y-2">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <QrCode className="h-4 w-4 text-accent" /> QR Code
              </p>
              <p className="text-xs text-muted-foreground">Imprima e deixe na casa: o hóspede aponta a câmera e abre o guia.</p>
              <a
                href={qrPng}
                download={`guia-${property.slug ?? property.id}.png`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-[#1A56DB] ring-1 ring-[#E2E8F0]"
              >
                <Download className="h-3.5 w-3.5" /> Baixar PNG
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2 — Localização exata da casa */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              <h2 className="font-semibold">Localização da casa</h2>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">O hóspede abre direto no Waze ou no Google Maps.</p>
          </div>
          <GuiaLocationForm
            key={`${property.id}-${savedPoint?.lat ?? ''}-${savedPoint?.lng ?? ''}`}
            propertyId={property.id}
            saved={savedPoint}
            fallbackCenter={savedPoint ?? cityCenter?.center ?? { lat: -14.235, lng: -51.925 }}
            locationUrl={property.locationUrl}
          />
        </CardContent>
      </Card>

      {/* 3 — Foto de capa */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-accent" />
            <h2 className="font-semibold">Foto de capa</h2>
          </div>
          <GuiaPlaceForm key={property.id} propertyId={property.id} coverImageUrl={property.coverImageUrl} />
        </CardContent>
      </Card>

      {/* 4 — Wi-Fi e entregas */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-accent" />
            <h2 className="font-semibold">Wi-Fi e Entregas</h2>
          </div>
          <GuiaWifiForm
            key={property.id}
            propertyId={property.id}
            propertyName={property.name}
            wifiName={property.wifiName}
            wifiPassword={property.wifiPassword}
            deliveryInstructions={property.deliveryInstructions}
            mapsUrl={mapsUrl}
          />
        </CardContent>
      </Card>

      {/* 5 — Botões do guia (modo compacto) */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            <h2 className="font-semibold">Botões do guia</h2>
          </div>
          <GuiaPartners
            key={property.id}
            propertyId={property.id}
            propertyName={property.name}
            defaultAddress={property.deliveryInstructions}
            mapsUrl={mapsUrl}
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

      {/* 6 — Caixinha de sugestões */}
      <Card>
        <CardContent className="pt-4">
          <GuiaSuggestionsToggle key={property.id} propertyId={property.id} enabled={property.suggestionsEnabled} />
        </CardContent>
      </Card>
    </div>
  )
}
