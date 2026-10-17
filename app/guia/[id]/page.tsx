import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Home, Wifi, Compass, Siren } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getCategoryMeta, PARTNER_CATEGORIES } from '@/lib/guia'
import { GuiaCopyButton } from '@/components/guia/GuiaCopyButton'
import { GuiaSplash } from '@/components/guia/GuiaSplash'
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

// Visual compartilhado dos cards da grade
const CARD =
  'flex h-full w-full flex-col items-center gap-2 rounded-[1.75rem] bg-gradient-to-b from-white to-[#F1F5FF] px-3 pb-4 pt-5 text-center ' +
  'shadow-[0_8px_24px_-8px_rgba(26,86,219,0.25)] ring-1 ring-[#1A56DB]/[0.06] transition active:scale-95'

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
  const hasContatos = hasWifi || contatos.length > 0 || !!guia.deliveryInstructions

  const nav = [
    { href: '#topo', label: 'Início', Icon: Home, show: true },
    { href: '#wifi', label: 'Wi-Fi', Icon: Wifi, show: hasWifi },
    { href: '#dicas', label: 'Dicas', Icon: Compass, show: dicas.length > 0 },
    { href: '#emergencia', label: 'Emergência', Icon: Siren, show: true },
  ].filter((n) => n.show)

  return (
    <div id="topo" className="font-display min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <GuiaSplash id={id} propertyName={guia.name} />
      <div className="mx-auto max-w-md pb-[calc(96px+env(safe-area-inset-bottom,0px))]">

        {/* CABEÇALHO */}
        <header className="rounded-b-[2.5rem] bg-[#0F172A] px-6 pb-10 pt-6 text-center text-white">
          <div className="flex items-center justify-center gap-2.5">
            <Image src="/icone.png" alt="" width={36} height={36} className="rounded-lg object-contain" priority />
            <div className="text-left leading-none">
              <p className="text-lg font-extrabold tracking-tight">Anfitrião</p>
              <p className="mt-0.5 text-[0.55rem] font-semibold tracking-[0.35em] text-white/60">MANAGEMENT</p>
            </div>
          </div>

          <h1 className="mt-8 text-[2.1rem] font-extrabold leading-tight">Bem-vindo(a)!</h1>
          <p className="mt-2 flex items-center justify-center gap-3 text-sm font-medium text-white/70">
            <span className="h-px w-6 bg-white/40" />
            <span className="max-w-[16rem] truncate">{guia.name}</span>
            <span className="h-px w-6 bg-white/40" />
          </p>
          {guia.city && (
            <p className="mt-1.5 text-xs text-white/40">📍 {guia.city}{guia.state ? `, ${guia.state}` : ''}</p>
          )}
        </header>

        {/* FOTO */}
        <div className="relative mx-4 -mt-5 h-52 overflow-hidden rounded-b-3xl rounded-t-[3rem] bg-gradient-to-br from-[#1A56DB] to-[#0F172A] shadow-[0_12px_32px_-12px_rgba(15,23,42,0.45)]">
          {guia.coverImageUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={guia.coverImageUrl} alt={guia.name} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            </>
          )}
          <p className="absolute inset-x-0 bottom-5 text-center text-2xl font-extrabold italic text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.45)]">
            Aproveite sua estadia!
          </p>
        </div>

        <main className="mt-8 space-y-8 px-4">

          {/* CONTATOS ÚTEIS */}
          {hasContatos && (
            <section>
              <SectionTitle>Contatos úteis</SectionTitle>
              <div className="grid grid-cols-2 gap-3.5">
                {hasWifi && (
                  <div id="wifi" className="scroll-mt-6">
                    {guia.wifiPassword ? (
                      <GuiaCopyButton text={guia.wifiPassword} toast="✅ Senha do Wi-Fi copiada!" className={CARD}>
                        <CardBody emoji="📶" iconBg="#E8F1FD" title={guia.wifiName || 'Wi-Fi'} hint="Toque para copiar a senha" />
                      </GuiaCopyButton>
                    ) : (
                      <div className={CARD}>
                        <CardBody emoji="📶" iconBg="#E8F1FD" title={guia.wifiName ?? 'Wi-Fi'} hint="Rede aberta" />
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
                    <CardBody emoji="📦" iconBg="#FFF4E6" title="Entregador" hint="Copiar como chegar" />
                  </GuiaCopyButton>
                )}
              </div>
            </section>
          )}

          {/* DICAS & ROTEIROS */}
          {dicas.length > 0 && (
            <section id="dicas" className="scroll-mt-6">
              <SectionTitle>Dicas & Roteiros</SectionTitle>
              <div className="grid grid-cols-2 gap-3.5">
                {dicas.map((item) => (
                  <PartnerCard key={item.id} item={item} preferMap />
                ))}
              </div>
            </section>
          )}

          {/* EMERGÊNCIA */}
          <section id="emergencia" className="scroll-mt-6">
            <SectionTitle>Emergência</SectionTitle>
            <div className="grid grid-cols-2 gap-2 rounded-3xl bg-[#FEF2F2] p-3 ring-1 ring-[#DC2626]/10">
              {EMERGENCIA.map((e) => (
                <a
                  key={e.num}
                  href={`tel:${e.num}`}
                  className="flex items-center justify-between gap-2 rounded-2xl bg-white/70 px-3 py-2.5 transition active:scale-95"
                >
                  <span className="truncate text-[0.8rem] font-semibold">{e.label}</span>
                  <span className="text-base font-extrabold tabular-nums text-[#DC2626]">{e.num}</span>
                </a>
              ))}
              {anfitriao?.whatsappUrl && (
                <a
                  href={anfitriao.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-2xl bg-white/70 px-3 py-2.5 transition active:scale-95"
                >
                  <span className="truncate text-[0.8rem] font-semibold">👋 Anfitrião</span>
                  <span className="text-xs font-extrabold text-[#DC2626]">WhatsApp</span>
                </a>
              )}
            </div>
          </section>
        </main>

        <SomarFooter className="mt-6" />
      </div>

      {/* NAVEGAÇÃO INFERIOR */}
      <nav className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="mx-auto mb-3 flex w-[calc(100%-2rem)] max-w-md items-center justify-around rounded-3xl bg-white/90 px-2 py-2 shadow-[0_8px_30px_-6px_rgba(15,23,42,0.25)] ring-1 ring-black/5 backdrop-blur-md">
          {nav.map(({ href, label, Icon }) => (
            <a
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[0.65rem] font-semibold transition active:scale-95 ${
                href === '#emergencia' ? 'text-[#DC2626]' : 'text-[#0F172A]/60 active:text-[#1A56DB]'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3.5 flex items-center gap-2 pl-1 text-base font-extrabold text-[#0F172A]">
      <span className="h-4 w-1 rounded-full bg-[#1A56DB]" />
      {children}
    </h2>
  )
}

function CardBody({ emoji, iconBg, title, hint, description }: {
  emoji: string
  iconBg: string
  title: string
  hint?: string
  description?: string | null
}) {
  return (
    <>
      <span className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] text-4xl" style={{ background: iconBg }}>
        {emoji}
      </span>
      <span className="line-clamp-2 text-[0.9rem] font-bold leading-tight text-[#0F172A]">{title}</span>
      {description && <span className="line-clamp-2 text-[0.7rem] leading-snug text-[#64748B]">{description}</span>}
      {hint && <span className="mt-auto text-[0.68rem] font-medium text-[#94A3B8]">{hint}</span>}
    </>
  )
}

function PartnerCard({ item, preferMap }: { item: Item; preferMap: boolean }) {
  const action = actionFor(item, preferMap)
  const meta = getCategoryMeta(item.category)
  const body = (
    <CardBody
      emoji={meta?.emoji ?? '📌'}
      iconBg={meta?.iconBg ?? '#F3F0FD'}
      title={item.name}
      description={item.description}
      hint={action?.hint}
    />
  )
  return action ? (
    <a
      href={action.href}
      target={action.href.startsWith('tel:') ? undefined : '_blank'}
      rel="noopener noreferrer"
      className={CARD}
    >
      {body}
    </a>
  ) : (
    <div className={CARD}>{body}</div>
  )
}
