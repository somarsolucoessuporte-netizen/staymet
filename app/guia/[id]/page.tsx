import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Nunito, Pacifico } from 'next/font/google'
import { prisma } from '@/lib/prisma'
import { getCategoryMeta, PARTNER_CATEGORIES } from '@/lib/guia'
import { GuiaCopyButton } from '@/components/guia/GuiaCopyButton'
import { SomarFooter } from '@/components/shared/SomarFooter'

// Guia público do hóspede: um link por imóvel, sem login.
// O anfitrião configura tudo em /anfitriao/guia.

const nunito = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '800'], display: 'swap' })
const pacifico = Pacifico({ subsets: ['latin'], weight: '400', display: 'swap' })

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

  return (
    <div className={`${nunito.className} min-h-screen bg-[#FEFCF8] text-[#252525]`}>
      <div className="mx-auto max-w-lg pb-6">

        {/* HERO */}
        <header className="relative overflow-hidden px-6 pb-12 pt-12 text-center text-white bg-gradient-to-br from-[#1A6B9E] to-[#135580]">
          {guia.coverImageUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={guia.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#1A6B9E]/80 to-[#135580]/90" />
            </>
          )}
          <div className="relative">
            <span className="mb-2 block text-3xl motion-safe:animate-bounce [animation-duration:3s]">🌊</span>
            <h1 className={`${pacifico.className} text-[clamp(1.8rem,7vw,2.6rem)] leading-tight drop-shadow-md`}>
              {guia.name}
            </h1>
            <p className="mt-1.5 text-[0.95rem] tracking-wide opacity-90">
              Bem-vindo(a)! Aqui está tudo que você precisa 🤙
            </p>
            {guia.city && <p className="mt-1 text-xs opacity-70">📍 {guia.city}{guia.state ? `, ${guia.state}` : ''}</p>}
          </div>
          <div className="absolute -bottom-px left-0 right-0 h-8 bg-[#FEFCF8] [clip-path:ellipse(55%_100%_at_50%_100%)]" />
        </header>

        <main className="space-y-7 px-4">

          {/* WI-FI */}
          {(guia.wifiName || guia.wifiPassword) && (
            <section>
              <SectionLabel>📶 Wi-Fi</SectionLabel>
              <div className="rounded-2xl bg-gradient-to-br from-[#25A888] to-[#1A9478] p-5 pb-4 text-white shadow-[0_2px_12px_rgba(0,0,0,.08)]">
                <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] opacity-80">Rede</p>
                <p className="mb-2.5 text-lg font-bold">{guia.wifiName || '—'}</p>
                {guia.wifiPassword && (
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1 break-all rounded-[10px] bg-white/20 px-3.5 py-2.5 font-bold tracking-wider">
                      {guia.wifiPassword}
                    </div>
                    <GuiaCopyButton
                      text={guia.wifiPassword}
                      label="Copiar"
                      toast="✅ Senha copiada!"
                      className="flex items-center gap-1.5 whitespace-nowrap rounded-[10px] bg-white/25 px-3.5 py-2.5 text-[0.8rem] font-bold active:bg-white/50"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* CONTATOS ÚTEIS */}
          {contatos.length > 0 && (
            <section>
              <SectionLabel>📞 Contatos úteis</SectionLabel>
              <div className="overflow-hidden rounded-2xl border border-black/[.07] bg-white shadow-[0_2px_12px_rgba(0,0,0,.08)] divide-y divide-black/[.07]">
                {contatos.map((item) => (
                  <Row key={item.id} item={item} preferMap={false} />
                ))}
              </div>
            </section>
          )}

          {/* ENTREGADORES */}
          {guia.deliveryInstructions && (
            <section>
              <SectionLabel>📦 Para entregadores</SectionLabel>
              <div className="overflow-hidden rounded-2xl border border-black/[.07] bg-white shadow-[0_2px_12px_rgba(0,0,0,.08)]">
                <div className="bg-[#1A6B9E] px-4 py-3 text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-white">
                  📍 Como chegar e entregar
                </div>
                <div className="p-4">
                  <div className="mb-3 whitespace-pre-line rounded-[10px] border border-black/[.07] bg-[#F5E6C8] p-3.5 text-[0.92rem] leading-relaxed">
                    {guia.deliveryInstructions}
                  </div>
                  <GuiaCopyButton
                    text={guia.deliveryInstructions}
                    label="Copiar texto para o entregador"
                    toast="✅ Texto copiado! Cole no chat do entregador"
                    className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#1A6B9E] py-3 text-[0.9rem] font-bold text-white active:opacity-85"
                  />
                </div>
              </div>
            </section>
          )}

          {/* DICAS & ROTEIROS */}
          {dicas.length > 0 && (
            <section>
              <SectionLabel>🗺️ Dicas & Roteiros</SectionLabel>
              <div className="space-y-2.5">
                {dicas.map((item) => {
                  const action = actionFor(item, true)
                  const meta = getCategoryMeta(item.category)
                  const body = (
                    <>
                      <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: meta?.iconBg ?? '#F5E6C8' }}>
                        {meta?.emoji ?? '📌'}
                      </span>
                      <span className="flex-1">
                        <span className="block text-[0.95rem] font-bold leading-tight">{item.name}</span>
                        <span className="mt-0.5 block text-[0.78rem] text-[#6B7480]">{item.description || action?.hint}</span>
                      </span>
                      {action && <span className="text-sm opacity-70">{action.pin}</span>}
                    </>
                  )
                  const cls = 'flex items-center gap-3.5 rounded-[14px] border border-black/[.07] bg-white px-4 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,.08)] transition active:bg-[#F5E6C8]'
                  return action ? (
                    <a key={item.id} href={action.href} target={action.href.startsWith('tel:') ? undefined : '_blank'} rel="noopener noreferrer" className={cls}>{body}</a>
                  ) : (
                    <div key={item.id} className={cls}>{body}</div>
                  )
                })}
              </div>
            </section>
          )}

          {/* EMERGÊNCIA */}
          <section>
            <SectionLabel>🚨 Emergência</SectionLabel>
            <div className="overflow-hidden rounded-2xl border-[1.5px] border-[#D63030]/20 bg-[#FEF2F2] shadow-[0_2px_12px_rgba(0,0,0,.08)]">
              <div className="bg-[#D63030] px-4 py-3 text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-white">
                🚨 Números de emergência
              </div>
              <div className="divide-y divide-[#D63030]/10">
                {EMERGENCIA.map((e) => (
                  <a key={e.num} href={`tel:${e.num}`} className="flex items-center gap-3.5 px-4 py-3 active:bg-[#D63030]/5">
                    <span className="flex-1 text-[0.9rem] font-bold">{e.label}</span>
                    <span className="text-base font-extrabold tabular-nums text-[#D63030]">{e.num}</span>
                  </a>
                ))}
                {anfitriao?.whatsappUrl && (
                  <a href={anfitriao.whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3.5 px-4 py-3 active:bg-[#D63030]/5">
                    <span className="flex-1 text-[0.9rem] font-bold">👋 Anfitrião</span>
                    <span className="text-base font-extrabold text-[#D63030]">WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </section>

          <p className="pt-2 text-center text-xs text-[#6B7480]">Boa estadia e aproveite! 🌊</p>
        </main>

        <SomarFooter className="mt-4" />
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 pl-0.5 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-[#6B7480]">{children}</p>
}

function Row({ item, preferMap }: { item: Item; preferMap: boolean }) {
  const action = actionFor(item, preferMap)
  const meta = getCategoryMeta(item.category)
  const body = (
    <>
      <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: meta?.iconBg ?? '#F3F0FD' }}>
        {meta?.emoji ?? '📌'}
      </span>
      <span className="flex-1">
        <span className="block text-[0.95rem] font-bold leading-tight">{item.name}</span>
        <span className="mt-0.5 block text-[0.78rem] text-[#6B7480]">{item.description || action?.hint}</span>
      </span>
      {action && <span className="text-lg text-[#6B7480]/60">›</span>}
    </>
  )
  const cls = 'flex items-center gap-3.5 px-4 py-3.5 transition active:bg-[#F5E6C8]'
  return action ? (
    <a href={action.href} target={action.href.startsWith('tel:') ? undefined : '_blank'} rel="noopener noreferrer" className={cls}>{body}</a>
  ) : (
    <div className={cls}>{body}</div>
  )
}
