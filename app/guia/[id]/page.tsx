import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Home, Wifi, Phone, Siren } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getCategoryMeta, PARTNER_CATEGORIES } from '@/lib/guia'
import { GuiaCopyButton } from '@/components/guia/GuiaCopyButton'
import { GuiaSplash } from '@/components/guia/GuiaSplash'
import { GuiaEmergencySheet } from '@/components/guia/GuiaEmergencySheet'
import { SomarFooter } from '@/components/shared/SomarFooter'

// Guia público do hóspede: um link por imóvel, sem login.
// O anfitrião configura tudo em /anfitriao/guia.

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
      partners: {
        where: { partner: { active: true } },
        select: {
          partner: {
            select: {
              id: true, name: true, category: true, description: true,
              phone: true, whatsappUrl: true, externalUrl: true, sortOrder: true,
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

/** Para onde o botão leva. Dicas priorizam o mapa; contatos priorizam o WhatsApp. */
function actionFor(item: Item, preferMap: boolean) {
  const wa = item.whatsappUrl ? { href: item.whatsappUrl, hint: 'Chamar no WhatsApp', pin: '💬' } : null
  const url = item.externalUrl
    ? /maps|goo\.gl/i.test(item.externalUrl)
      ? { href: item.externalUrl, hint: 'Ver rota no mapa', pin: '📍' }
      : { href: item.externalUrl, hint: 'Abrir site', pin: '🔗' }
    : null
  const tel = item.phone ? { href: `tel:${item.phone.replace(/[^\d+]/g, '')}`, hint: 'Ligar', pin: '📞' } : null
  return (preferMap ? url ?? wa : wa ?? url) ?? tel
}

const EMERGENCIA = [
  { label: '🚑 SAMU', num: '192' },
  { label: '🔥 Bombeiros', num: '193' },
  { label: '👮 Polícia Militar', num: '190' },
]

// Card padrão da grade: ~76px, só ícone + nome
const CARD =
  'flex h-[76px] w-full min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border border-[#E2E8F0] bg-white px-2 shadow-sm transition active:scale-95'

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
    ...EMERGENCIA.map((e) => ({ label: e.label, value: e.num, href: `tel:${e.num}` })),
    ...(anfitriao?.whatsappUrl
      ? [{ label: '👋 Anfitrião', value: 'WhatsApp', href: anfitriao.whatsappUrl, external: true }]
      : []),
  ]

  const nav = [
    { href: '#topo', label: 'Início', Icon: Home },
    ...(hasWifi ? [{ href: '#wifi', label: 'Wi-Fi', Icon: Wifi }] : []),
    { href: '#contatos', label: 'Contatos', Icon: Phone },
    { href: '#emergencia', label: 'Emergência', Icon: Siren },
  ]

  return (
    <div id="topo" className="font-display min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <GuiaSplash id={id} propertyName={guia.name} />

      <div className="mx-auto max-w-md pb-[calc(76px+env(safe-area-inset-bottom,0px))]">

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

        {/* GRADE ÚNICA: Wi-Fi → contatos → emergência → dicas */}
        <main id="contatos" className="grid scroll-mt-2 grid-cols-2 gap-2.5 px-3 pt-3">
          {hasWifi && (
            <div id="wifi" className="scroll-mt-20">
              {guia.wifiPassword ? (
                <GuiaCopyButton
                  text={guia.wifiPassword}
                  toast={`✅ Senha copiada: ${guia.wifiName || 'Wi-Fi'}`}
                  className={CARD}
                >
                  <CardBody emoji="📶" title="Wi-Fi" />
                </GuiaCopyButton>
              ) : (
                <div className={CARD}>
                  <CardBody emoji="📶" title={guia.wifiName ?? 'Wi-Fi'} />
                </div>
              )}
            </div>
          )}

          {contatos.map((item) => (
            <PartnerCard key={item.id} item={item} preferMap={false} />
          ))}

          {guia.deliveryInstructions && (
            <GuiaCopyButton
              text={guia.deliveryInstructions}
              toast="✅ Texto copiado! Cole no chat do entregador"
              className={CARD}
            >
              <CardBody emoji="📦" title="Entregador" />
            </GuiaCopyButton>
          )}

          <a href="#emergencia" className={`${CARD} border-red-200 bg-red-50`}>
            <CardBody emoji="🚨" title="Emergência" titleClass="text-[#B91C1C]" />
          </a>

          {dicas.length > 0 && (
            <>
              <p className="col-span-2 pl-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Dicas & Roteiros
              </p>
              {dicas.map((item) => (
                <PartnerCard key={item.id} item={item} preferMap />
              ))}
            </>
          )}
        </main>

        <SomarFooter className="mt-3 py-3" />
      </div>

      <GuiaEmergencySheet lines={emergencyLines} />

      {/* BARRA INFERIOR — fixa, 60px */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E2E8F0] bg-white pb-[env(safe-area-inset-bottom,0px)]">
        <div className="mx-auto flex h-[60px] max-w-md items-stretch">
          {nav.map(({ href, label, Icon }) => (
            <a
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium active:scale-95 ${
                href === '#emergencia' ? 'text-[#DC2626]' : 'text-[#475569]'
              }`}
            >
              <Icon size={22} />
              {label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  )
}

function CardBody({ emoji, title, titleClass }: { emoji: string; title: string; titleClass?: string }) {
  return (
    <>
      <span className="text-3xl leading-none">{emoji}</span>
      <span className={`w-full truncate text-center text-[13px] font-semibold text-[#0F172A] ${titleClass ?? ''}`}>{title}</span>
    </>
  )
}

function PartnerCard({ item, preferMap }: { item: Item; preferMap: boolean }) {
  const action = actionFor(item, preferMap)
  const meta = getCategoryMeta(item.category)
  const body = <CardBody emoji={meta?.emoji ?? '📌'} title={item.name} />
  return action ? (
    <a
      href={action.href}
      target={action.href.startsWith('tel:') ? undefined : '_blank'}
      rel="noopener noreferrer"
      aria-label={`${item.name} — ${action.hint}`}
      className={CARD}
    >
      {body}
    </a>
  ) : (
    <div className={CARD}>{body}</div>
  )
}
