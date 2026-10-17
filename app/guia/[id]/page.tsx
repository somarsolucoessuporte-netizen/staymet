import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCategoryMeta, PARTNER_CATEGORIES, buildGuestMessage, isOrderCategory, withWhatsappText } from '@/lib/guia'
import { GuiaSplash } from '@/components/guia/GuiaSplash'
import { GuiaGrid, type GuiaCardData } from '@/components/guia/GuiaGrid'
import { CategoryIcon } from '@/components/guia/CategoryIcon'
import { SomarFooter } from '@/components/shared/SomarFooter'

// Guia público do hóspede: um link por imóvel, sem login.
// O anfitrião configura tudo em /anfitriao/guia. Cada botão abre um bottom sheet explicando o que faz.

export const dynamic = 'force-dynamic'

async function getGuia(id: string) {
  return prisma.property.findFirst({
    where: { id, active: true },
    select: {
      name: true,
      city: true,
      state: true,
      coverImageUrl: true,
      wifiName: true,
      wifiPassword: true,
      deliveryInstructions: true,
      suggestionsEnabled: true,
      partners: {
        where: { partner: { active: true } },
        select: {
          partner: {
            select: {
              id: true, name: true, category: true, description: true,
              phone: true, whatsappUrl: true, externalUrl: true, sortOrder: true, deliveryNote: true,
            },
          },
        },
      },
    },
  })
}

type Guia = NonNullable<Awaited<ReturnType<typeof getGuia>>>
type Item = Guia['partners'][number]['partner']

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const guia = await getGuia(id)
  return {
    title: guia ? `${guia.name} — Guia do hóspede` : 'Guia do hóspede',
    robots: { index: false, follow: false },
    manifest: `/guia/${id}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: guia?.name ?? 'Guia', statusBarStyle: 'default' },
  }
}

const EMERGENCIA = [
  { label: 'SAMU', num: '192', kind: 'SAMU' },
  { label: 'Bombeiros', num: '193', kind: 'BOMBEIROS' },
  { label: 'Polícia Militar', num: '190', kind: 'POLICIA' },
]

const isMaps = (url: string) => /maps|goo\.gl/i.test(url)

/** Legenda de 1 linha no card: o que acontece ao tocar */
function captionFor(item: Item, section: string) {
  if (section === 'dicas') {
    if (item.externalUrl) return isMaps(item.externalUrl) ? 'Ver rota' : 'Abrir site'
    return item.whatsappUrl ? 'Chamar no WhatsApp' : item.phone ? 'Ligar' : 'Ver detalhes'
  }
  if (item.whatsappUrl) {
    if (item.category === 'ANFITRIAO') return 'Falar com o anfitrião'
    return isOrderCategory(item.category) ? 'Pedir pelo WhatsApp' : 'Chamar no WhatsApp'
  }
  if (item.phone) return 'Ligar'
  if (item.externalUrl) return isMaps(item.externalUrl) ? 'Ver no mapa' : 'Abrir site'
  return 'Ver detalhes'
}

function partnerCard(item: Item, guia: Guia): GuiaCardData {
  const section = getCategoryMeta(item.category)?.section ?? 'contatos'
  const icon = <CategoryIcon kind={item.category} />

  if (section === 'dicas') {
    return {
      id: item.id, title: item.name, caption: captionFor(item, section), group: 'dicas', icon,
      sheetTitle: getCategoryMeta(item.category)?.label ?? 'Dica',
      sheet: {
        type: 'dica', name: item.name, description: item.description,
        externalUrl: item.externalUrl, whatsappUrl: item.whatsappUrl, phone: item.phone,
      },
    }
  }

  const order = isOrderCategory(item.category)
  const message = buildGuestMessage(item.category, guia.name, item.deliveryNote || guia.deliveryInstructions)
  return {
    id: item.id, title: item.name, caption: captionFor(item, section), group: 'principal', icon,
    sheetTitle: getCategoryMeta(item.category)?.label ?? 'Contato',
    sheet: {
      type: 'contato',
      name: item.name,
      description: item.description,
      whatsappHref: item.whatsappUrl ? withWhatsappText(item.whatsappUrl, message) : null,
      primaryLabel: item.category === 'ANFITRIAO' ? 'Falar com o anfitrião' : order ? 'Pedir pelo WhatsApp' : 'Chamar no WhatsApp',
      message,
      showMessage: order,
      phone: item.phone,
      externalUrl: item.externalUrl,
    },
  }
}

export default async function GuiaPublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const guia = await getGuia(id)
  if (!guia) notFound()

  const order = PARTNER_CATEGORIES.map((c) => c.value as string)
  const items = guia.partners
    .map((p) => p.partner)
    .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.sortOrder - b.sortOrder)

  const sectionOf = (cat: string) => getCategoryMeta(cat)?.section ?? 'contatos'
  const contatos = items.filter((i) => sectionOf(i.category) === 'contatos')
  const dicas = items.filter((i) => sectionOf(i.category) === 'dicas')
  const anfitriao = items.find((i) => i.category === 'ANFITRIAO' && i.whatsappUrl)

  const hasWifi = !!(guia.wifiName || guia.wifiPassword)

  const emergencyLines = [
    ...EMERGENCIA.map((e) => ({ label: e.label, value: e.num, href: `tel:${e.num}`, kind: e.kind })),
    ...(anfitriao?.whatsappUrl
      ? [{
          label: 'Anfitrião',
          kind: 'ANFITRIAO',
          value: 'WhatsApp',
          href: withWhatsappText(anfitriao.whatsappUrl, buildGuestMessage('ANFITRIAO', guia.name)),
          external: true,
        }]
      : []),
  ]

  // Ordem da grade: Wi-Fi → contatos → entregador → emergência → dicas
  const cards: GuiaCardData[] = [
    ...(hasWifi
      ? [{
          id: 'wifi', title: 'Wi-Fi', caption: 'Rede e senha', group: 'principal' as const,
          icon: <CategoryIcon kind="WIFI" />, sheetTitle: 'Wi-Fi da casa',
          sheet: { type: 'wifi' as const, network: guia.wifiName, password: guia.wifiPassword },
        }]
      : []),
    ...contatos.map((i) => partnerCard(i, guia)),
    ...(guia.deliveryInstructions
      ? [{
          id: 'entregador', title: 'Entregador', caption: 'Endereço para entregas', group: 'principal' as const,
          icon: <CategoryIcon kind="ENTREGADOR" />, sheetTitle: 'Endereço para entregas',
          sheet: { type: 'entregador' as const, text: guia.deliveryInstructions },
        }]
      : []),
    {
      id: 'emergencia', title: 'Emergência', caption: 'Números úteis', group: 'principal', tone: 'red',
      icon: <CategoryIcon kind="EMERGENCIA" />, sheetTitle: 'Emergência',
      sheet: { type: 'emergencia', lines: emergencyLines },
    },
    ...(guia.suggestionsEnabled
      ? [{
          id: 'sugestoes', title: 'Caixinha de sugestões', caption: 'Sua opinião importa', group: 'principal' as const,
          icon: <CategoryIcon kind="SUGESTOES" />, sheetTitle: '', href: `/guia/${id}/sugestoes`,
        }]
      : []),
    ...dicas.map((i) => partnerCard(i, guia)),
  ]

  return (
    <div id="topo" className="font-display flex min-h-[100dvh] flex-col bg-[#F8FAFC] text-[#0F172A]">
      <GuiaSplash id={id} propertyName={guia.name} />

      <div className="mx-auto w-full max-w-md flex-1">

        {/* CABEÇALHO — máx. 72px */}
        <header className="relative flex h-[72px] items-center justify-center rounded-t-2xl bg-gradient-to-r from-[#0F3A7A] to-[#1A56DB] px-12 pb-2 text-white">
          <Image src="/icone.png" alt="" width={28} height={28} priority className="absolute left-3 top-1/2 -mt-1 -translate-y-1/2 rounded-md" />
          <div className="min-w-0 text-center leading-tight">
            <h1 className="text-lg font-bold">Bem-vindo(a)!</h1>
            <p className="flex items-center justify-center gap-2 text-xs text-white/80">
              <span className="h-px w-3 shrink-0 bg-white/50" />
              <span className="truncate">{guia.name}</span>
              <span className="h-px w-3 shrink-0 bg-white/50" />
            </p>
          </div>
        </header>

        {/* FOTO — 140px, de ponta a ponta */}
        <div className="relative -mt-2 h-[140px] overflow-hidden rounded-t-xl bg-gradient-to-br from-[#1A56DB] to-[#0F3A7A]">
          {guia.coverImageUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={guia.coverImageUrl} alt={guia.name} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
            </>
          )}
          <p className="absolute inset-x-0 bottom-2.5 text-center text-lg font-bold italic text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.5)]">
            Aproveite sua estadia!
          </p>
        </div>

        <GuiaGrid cards={cards} />
      </div>

      <SomarFooter className="mt-auto pt-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))]" />
    </div>
  )
}
