import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ArrowSquareOut } from '@phosphor-icons/react/ssr'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { SuggestionFlow, type SuggestionUser, type ReviewChannel } from '@/components/guia/SuggestionFlow'
import { CategoryIcon } from '@/components/guia/CategoryIcon'
import { SomarFooter } from '@/components/shared/SomarFooter'
import { isoToDate, todayISO, SOURCE_META } from '@/lib/agenda'

// "Avaliar estadia" do guia público: links de avaliação dos sites (Airbnb, Booking, Google...)
// cadastrados pelo anfitrião + avaliação com estrelas aqui no app (exige entrar, como a caixinha).
// Sem login: a reserva em andamento hoje (Agenda) diz de qual site o hóspede veio, e esse botão vem em destaque.

/** Palavras que ligam a origem da reserva ao botão de avaliação cadastrado pelo anfitrião */
const SOURCE_MATCH: Record<string, RegExp> = {
  AIRBNB: /airbnb/i,
  BOOKING: /booking/i,
  VRBO: /vrbo|expedia|hotels\.com/i,
  OLX: /olx/i,
}

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Avaliar estadia',
  robots: { index: false, follow: false },
}

export default async function AvaliarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const property = await prisma.property.findFirst({
    where: { id, active: true },
    select: {
      id: true,
      name: true,
      suggestionsEnabled: true,
      partners: {
        where: { partner: { active: true, category: 'AVALIACAO', externalUrl: { not: null } } },
        select: { partner: { select: { id: true, name: true, externalUrl: true, sortOrder: true } } },
      },
    },
  })
  if (!property) notFound()

  const channels: ReviewChannel[] = property.partners
    .map((p) => p.partner)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((p) => ({ id: p.id, name: p.name, url: p.externalUrl! }))

  // Reserva em andamento hoje (quem sai hoje vem primeiro: é a hora de avaliar). Bloqueios não contam.
  const today = isoToDate(todayISO())
  const current = await prisma.booking.findFirst({
    where: { propertyId: id, status: 'CONFIRMADA', source: { not: 'BLOQUEIO' }, startDate: { lte: today }, endDate: { gte: today } },
    orderBy: { endDate: 'asc' },
    select: { source: true },
  })
  const re = current ? SOURCE_MATCH[current.source] : undefined
  const match = re ? channels.find((c) => re.test(c.name) || re.test(c.url)) : undefined
  const others = match ? channels.filter((c) => c.id !== match.id) : channels
  const sourceLabel = current ? SOURCE_META[current.source].label : null

  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  let user: SuggestionUser | null = null
  if (authUser?.email) {
    const db = await prisma.user.findUnique({ where: { supabaseId: authUser.id }, select: { name: true, avatarUrl: true } })
    const meta = authUser.user_metadata ?? {}
    user = {
      fullName: db?.name ?? meta.full_name ?? meta.name ?? authUser.email.split('@')[0],
      email: authUser.email,
      avatarUrl: db?.avatarUrl ?? meta.avatar_url ?? meta.picture ?? null,
    }
  }

  return (
    <div className="font-display flex min-h-[100dvh] flex-col bg-[#F8FAFC] text-[#0F172A]">
      <div className="mx-auto w-full max-w-md flex-1">
        <header className="relative flex h-[60px] items-center justify-center bg-gradient-to-r from-[#0F3A7A] to-[#1A56DB] px-12 text-white">
          <a href={`/guia/${id}`} aria-label="Voltar ao guia" className="absolute left-2 rounded-full p-2 active:bg-white/10">
            <ArrowLeft size={20} />
          </a>
          <Image src="/icone.png" alt="" width={24} height={24} className="absolute right-3 rounded-md" />
          <p className="truncate text-sm font-semibold">{property.name}</p>
        </header>

        <main className="space-y-6 px-4 py-6">
          {channels.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <CategoryIcon kind="AVALIAR" size={44} />
                <div>
                  <h1 className="text-lg font-extrabold leading-tight">Avalie sua estadia</h1>
                  <p className="text-sm text-[#475569]">
                    {match ? `Você reservou pelo ${sourceLabel}` : 'No site em que você reservou'}
                  </p>
                </div>
              </div>
              {match && (
                <a
                  href={match.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#1A56DB] text-[15px] font-semibold text-white shadow-sm transition active:scale-[0.98]"
                >
                  {match.name} <ArrowSquareOut size={18} weight="bold" />
                </a>
              )}
              {match && others.length > 0 && (
                <p className="pt-1 text-xs font-semibold text-[#64748B]">Reservou por outro site?</p>
              )}
              <div className="space-y-2">
                {others.map((c) => (
                  <a
                    key={c.id}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 items-center justify-between rounded-2xl bg-white px-4 text-[15px] font-semibold ring-1 ring-black/10 transition active:scale-[0.98]"
                  >
                    {c.name}
                    <ArrowSquareOut size={18} color="#64748B" />
                  </a>
                ))}
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Abre a página de avaliações do site. Se pedir, entre com a conta usada na reserva.
              </p>
            </section>
          )}

          {property.suggestionsEnabled && (
            <section className="space-y-4">
              {channels.length > 0 && (
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                  <span className="h-px flex-1 bg-[#E2E8F0]" /> ou avalie aqui no guia <span className="h-px flex-1 bg-[#E2E8F0]" />
                </div>
              )}
              <SuggestionFlow key={user?.email ?? 'anon'} propertyId={property.id} propertyName={property.name} user={user} mode="avaliacao" channels={match ? [match] : channels} />
            </section>
          )}

          {channels.length === 0 && !property.suggestionsEnabled && (
            <p className="rounded-2xl bg-white p-5 text-center text-sm text-[#64748B] ring-1 ring-black/5">
              A avaliação não está disponível para este imóvel no momento.
            </p>
          )}
        </main>
      </div>
      <SomarFooter className="mt-auto pb-[calc(12px+env(safe-area-inset-bottom,0px))]" />
    </div>
  )
}
