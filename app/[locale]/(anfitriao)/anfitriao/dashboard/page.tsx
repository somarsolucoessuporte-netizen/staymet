import Image from 'next/image'
import Link from 'next/link'
import { Lightbulb, AlertTriangle, LayoutGrid, ChevronRight, Building2 } from 'lucide-react'
import { getCurrentDbUser } from '@/lib/guia-access'
import { getAnfitriaoProperties } from '@/lib/anfitriao-properties'
import { getOccurrenceSummary } from '@/lib/occurrence-summary'
import { getRequestOrigin } from '@/lib/request-origin'
import { PropertyGuideCard } from '@/components/anfitriao/PropertyGuideCard'
import { OriginBadge } from '@/components/shared/OriginBadge'
import { SignIn, SignOut } from '@phosphor-icons/react/ssr'
import { getConflicts, getUpcomingMovements } from '@/lib/agenda-server'
import { todayISO } from '@/lib/agenda'
import { ConflictCard } from '@/components/agenda/ConflictCard'

// Check-ins/check-outs vêm da Agenda (canais iCal + reservas diretas).
// O painel também mostra guia do hóspede, sugestões, ocorrências e conflitos de datas.

function capitalize(s: string) {
  return s ? s.charAt(0).toLocaleUpperCase('pt-BR') + s.slice(1) : s
}

function timeAgo(date: Date) {
  const min = Math.round((Date.now() - new Date(date).getTime()) / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.round(h / 24)
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`
}

const STATUS_LABEL: Record<string, string> = { ABERTA: 'Aberta', EM_ANDAMENTO: 'Em andamento' }
const statusText = (o: { category: string; status: string }) =>
  o.category === 'SUGESTAO' ? 'Nova' : STATUS_LABEL[o.status] ?? o.status

export default async function AnfitriaoDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dbUser = await getCurrentDbUser()
  if (!dbUser) return null

  const properties = await getAnfitriaoProperties(dbUser)
  const propertyIds = properties.map((p) => p.id)
  const [summary, origin, conflicts, moves] = await Promise.all([
    getOccurrenceSummary(dbUser),
    getRequestOrigin(),
    getConflicts(propertyIds),
    getUpcomingMovements(propertyIds, 0),
  ])
  const todayIso = todayISO()
  const checkinsToday = moves.filter((m) => m.kind === 'checkin' && m.date === todayIso).length
  const checkoutsToday = moves.filter((m) => m.kind === 'checkout' && m.date === todayIso).length
  const agendaHref = `/${locale}/anfitriao/agenda`
  const activeButtons = properties.reduce((n, p) => n + p.activeButtons, 0)

  const firstName = capitalize(dbUser.name.trim().split(' ')[0] ?? '')
  const today = capitalize(
    new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Fortaleza' }).format(new Date()),
  )

  const occurrencesHref = `/${locale}/anfitriao/ocorrencias`
  const stats = [
    { label: 'Sugestões novas',     value: summary.suggestionsNew, href: `${occurrencesHref}?aba=sugestoes`, Icon: Lightbulb,     iconCls: 'bg-amber-50 text-amber-600' },
    { label: 'Ocorrências abertas', value: summary.openOccurrences,                               href: occurrencesHref,                    Icon: AlertTriangle, iconCls: 'bg-red-50 text-red-600' },
    { label: 'Botões no guia',      value: activeButtons,                                          href: `/${locale}/anfitriao/guia`,        Icon: LayoutGrid,    iconCls: 'bg-blue-50 text-[#1A56DB]' },
  ]

  return (
    <div className="font-display text-[#0F172A]">
      {/* CABEÇALHO */}
      <header className="rounded-b-[2.5rem] bg-[#0F172A] px-5 pb-14 pt-6 text-white">
        <div className="flex items-center gap-2.5">
          <Image src="/icone.png" alt="" width={32} height={32} className="rounded-lg object-contain" priority />
          <div className="leading-none">
            <p className="text-base font-extrabold tracking-tight">Anfitrião</p>
            <p className="mt-0.5 text-[0.5rem] font-semibold tracking-[0.35em] text-white/60">MANAGEMENT</p>
          </div>
        </div>
        <h1 className="mt-6 text-2xl font-extrabold">Olá, {firstName}</h1>
        <p className="mt-0.5 text-sm text-white/60">{today}</p>
      </header>

      <div className="-mt-9 space-y-7 px-4">
        {/* NÚMEROS */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Check-ins hoje', value: checkinsToday, Icon: SignIn, iconCls: 'bg-emerald-50 text-emerald-600' },
            { label: 'Check-outs hoje', value: checkoutsToday, Icon: SignOut, iconCls: 'bg-orange-50 text-orange-600' },
          ].map((s) => (
            <Link
              key={s.label}
              href={agendaHref}
              className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-[0_8px_24px_-8px_rgba(26,86,219,0.25)] ring-1 ring-[#1A56DB]/[0.06] transition active:scale-[0.97]"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.iconCls}`}>
                <s.Icon size={20} weight="bold" />
              </span>
              <span className="min-w-0">
                <span className="block text-2xl font-extrabold leading-none tabular-nums">{s.value}</span>
                <span className="mt-1 block text-[12px] font-medium leading-tight text-[#64748B]">{s.label}</span>
              </span>
            </Link>
          ))}
        </div>
        <div className="!mt-2.5 grid grid-cols-3 gap-2.5">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="flex flex-col rounded-3xl bg-white p-3 shadow-[0_8px_24px_-8px_rgba(26,86,219,0.25)] ring-1 ring-[#1A56DB]/[0.06] transition active:scale-[0.97]"
            >
              <span className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl ${s.iconCls}`}>
                <s.Icon size={16} />
              </span>
              <span className="text-2xl font-extrabold tabular-nums">{s.value}</span>
              <span className="mt-0.5 text-[12px] font-medium leading-tight text-[#64748B] [overflow-wrap:normal] [word-break:normal] hyphens-none">
                {s.label}
              </span>
            </Link>
          ))}
        </div>

        {/* SEUS IMÓVEIS */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 pl-1 text-base font-extrabold">
            <Building2 size={18} className="text-[#1A56DB]" /> Seus imóveis
          </h2>
          {properties.length === 0 ? (
            <p className="rounded-3xl bg-white p-5 text-sm text-[#64748B] ring-1 ring-black/5">
              Você ainda não está vinculado a nenhum imóvel. Peça ao gestor para te vincular.
            </p>
          ) : (
            <div className="space-y-4">
              {properties.map((p) => (
                <PropertyGuideCard key={p.id} property={p} locale={locale} origin={origin} />
              ))}
            </div>
          )}
        </section>

        {/* PRECISA DA SUA ATENÇÃO */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 pl-1 text-base font-extrabold">
            <AlertTriangle size={18} className="text-[#1A56DB]" /> Precisa da sua atenção
          </h2>
          {conflicts.length > 0 && (
            <div className="mb-3 space-y-2">
              {conflicts.map((c) => (
                <ConflictCard
                  key={`${c.a.id}-${c.b.id}`}
                  conflict={c}
                  showProperty={properties.length > 1}
                  agendaHref={`${agendaHref}?propertyId=${c.propertyId}&mes=${c.a.startDate.slice(0, 7)}`}
                />
              ))}
            </div>
          )}
          {summary.attention.length === 0 && conflicts.length > 0 ? null : summary.attention.length === 0 ? (
            <p className="rounded-3xl bg-white p-5 text-center text-sm text-[#64748B] ring-1 ring-black/5">
              Tudo em ordem por aqui.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
              {summary.attention.map((o) => (
                <Link
                  key={o.id}
                  href={`${occurrencesHref}/${o.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition active:bg-gray-50"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${o.category === 'SUGESTAO' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                    {o.category === 'SUGESTAO' ? <Lightbulb size={17} /> : <AlertTriangle size={17} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{o.title}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#64748B]">
                      <OriginBadge source={o.source} name={o.reporterName} />
                      <span className="truncate">{o.propertyName}</span>
                      <span>· {timeAgo(o.createdAt)}</span>
                      <span>· {statusText(o)}</span>
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-[#94A3B8]" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
