import Image from 'next/image'
import Link from 'next/link'
import {
  Building2, Users, AlertCircle, BarChart3, Settings, ExternalLink,
  ChevronRight, Eye, MessageSquareWarning, SlidersHorizontal, Link2, BookOpen, MapPin, CalendarDays, LogIn,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getRequestOrigin } from '@/lib/request-origin'
import { getCurrentDbUser } from '@/lib/guia-access'
import { GuiaCopyButton } from '@/components/guia/GuiaCopyButton'
import { getConflicts, getUpcomingMovements } from '@/lib/agenda-server'
import { addDays, isoToDate, todayISO, SOURCE_META } from '@/lib/agenda'
import { SUGGESTION_CATEGORY } from '@/lib/occurrences'
import { formatCityState, formatFirstName } from '@/lib/utils'
import { ConflictCard } from '@/components/agenda/ConflictCard'
import { SomarFooter } from '@/components/shared/SomarFooter'

// Acesso já restrito a ADMINISTRADOR pelo layout (admin)

// Reservas e check-ins vêm da Agenda (model Booking), como no dashboard do anfitrião
async function getStats() {
  const [totalClients, totalProperties, suggestionsNew] = await Promise.all([
    prisma.user.count({ where: { role: 'PROPRIETARIO' } }),
    prisma.property.count({ where: { active: true } }),
    prisma.occurrence.count({ where: { category: SUGGESTION_CATEGORY, status: 'ABERTA', archivedAt: null } }),
  ])
  return { totalClients, totalProperties, suggestionsNew }
}

const shortDay = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' })

async function getGuiaProperties() {
  return prisma.property.findMany({
    where: { active: true },
    select: {
      id: true, name: true, city: true, state: true, coverImageUrl: true,
      _count: { select: { partners: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [dbUser, stats, properties, origin] = await Promise.all([
    getCurrentDbUser(),
    getStats(),
    getGuiaProperties(),
    getRequestOrigin(),
  ])
  const firstName = formatFirstName(dbUser?.name) || 'Admin'
  const propertyIds = properties.map((p) => p.id)
  const [conflicts, moves] = await Promise.all([getConflicts(propertyIds), getUpcomingMovements(propertyIds, 7)])

  const today = todayISO()
  const tomorrow = addDays(today, 1)
  const agendaHref = `/${locale}/anfitriao/agenda`
  const checkins = moves.filter((m) => m.kind === 'checkin')
  const checkinsToday = checkins.filter((m) => m.date === today).length
  const nextCheckins = checkins.slice(0, 3)
  const dayLabel = (iso: string) => (iso === today ? 'Hoje' : iso === tomorrow ? 'Amanhã' : shortDay.format(isoToDate(iso)))

  const statCards: { title: string; value: number; href?: string; alert?: boolean }[] = [
    { title: 'Clientes',       value: stats.totalClients },
    { title: 'Imóveis ativos', value: stats.totalProperties, href: `/${locale}/admin/imoveis` },
    { title: 'Reservas hoje',  value: checkinsToday, href: agendaHref },
    // Conflito de datas tem prioridade sobre as sugestões
    conflicts.length > 0
      ? {
          title: 'Conflitos de datas',
          value: conflicts.length,
          href: `${agendaHref}?propertyId=${conflicts[0].propertyId}&mes=${conflicts[0].a.startDate.slice(0, 7)}`,
          alert: true,
        }
      : { title: 'Sugestões novas', value: stats.suggestionsNew, href: `/${locale}/admin/ocorrencias?aba=sugestoes` },
  ]

  const navItems = [
    { icon: Users,       title: 'Gestão de Usuários',  desc: 'Listar, criar e gerenciar usuários do sistema.', href: `/${locale}/admin/usuarios`,   iconCls: 'bg-blue-50 text-[#1A56DB]' },
    { icon: Building2,   title: 'Gestão de Imóveis',   desc: 'Visualizar todos os imóveis e seus status.',      href: `/${locale}/admin/imoveis`,    iconCls: 'bg-emerald-50 text-emerald-600' },
    { icon: MessageSquareWarning, title: 'Ocorrências e sugestões', desc: 'Problemas da operação e a caixinha dos hóspedes.', href: `/${locale}/admin/ocorrencias`, iconCls: 'bg-red-50 text-red-600' },
    { icon: CalendarDays, title: 'Agenda e canais',    desc: 'Calendário único com Airbnb, Booking, Vrbo e diretas.', href: `/${locale}/anfitriao/agenda`, iconCls: 'bg-sky-50 text-sky-600' },
    { icon: AlertCircle, title: 'Vistorias Pendentes', desc: 'Validar vistorias digitais de entrada/saída.',    href: `/${locale}/admin/vistorias`,  iconCls: 'bg-orange-50 text-orange-600' },
    // Página ainda não existe: fica desabilitado até ser criada
    { icon: BarChart3,   title: 'Relatórios',          desc: 'Relatórios de ocupação, receita e performance.',  href: null,                          iconCls: 'bg-purple-50 text-purple-600' },
  ]

  const quickAccess = [
    { label: 'Dashboard Gestor',       href: `/${locale}/gestor/dashboard?viewAs=GESTOR`,              role: 'GESTOR' },
    { label: 'Dashboard Proprietário', href: `/${locale}/proprietario/dashboard?viewAs=PROPRIETARIO`, role: 'PROPRIETARIO' },
    { label: 'Dashboard Anfitrião',    href: `/${locale}/anfitriao/dashboard?viewAs=ANFITRIAO`,       role: 'ANFITRIAO' },
    { label: 'Boas-vindas Hóspede',    href: `/${locale}/hospede/boas-vindas?viewAs=HOSPEDE`,         role: 'HOSPEDE' },
    { label: 'Tarefas Prestador',      href: `/${locale}/prestador/tarefas?viewAs=PRESTADOR`,          role: 'PRESTADOR' },
  ]

  return (
    <div className="font-display min-h-screen bg-[#F8FAFC] text-[#0F172A]">

      {/* CABEÇALHO */}
      <header className="rounded-b-[2.5rem] bg-[#0F172A] px-5 pb-16 pt-6 text-white lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2.5">
            <Image src="/icone.png" alt="" width={34} height={34} className="rounded-lg object-contain" priority />
            <div className="leading-none">
              <p className="text-base font-extrabold tracking-tight">Anfitrião</p>
              <p className="mt-0.5 text-[0.5rem] font-semibold tracking-[0.35em] text-white/60">MANAGEMENT</p>
            </div>
          </div>
          <h1 className="mt-7 text-2xl font-extrabold">Olá, {firstName}</h1>
          <p className="mt-0.5 text-sm text-white/60">Painel administrativo</p>
        </div>
      </header>

      <main className="mx-auto -mt-10 max-w-5xl space-y-8 px-5 lg:px-8">

        {/* NÚMEROS */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((s) => {
            const cls = s.alert
              ? 'rounded-3xl bg-red-600 p-4 text-white shadow-[0_8px_24px_-8px_rgba(220,38,38,0.45)]'
              : 'rounded-3xl bg-white p-4 shadow-[0_8px_24px_-8px_rgba(26,86,219,0.25)] ring-1 ring-[#1A56DB]/[0.06]'
            const body = (
              <>
                <p className={`text-3xl font-extrabold tabular-nums ${s.alert ? 'text-white' : 'text-[#0F172A]'}`}>{s.value}</p>
                <p className={`mt-0.5 text-xs font-medium ${s.alert ? 'text-white/85' : 'text-[#64748B]'}`}>
                  {s.alert ? `${s.title}: ${s.value}` : s.title}
                </p>
              </>
            )
            return s.href ? (
              <Link key={s.title} href={s.href} className={`${cls} block transition active:scale-[0.98]`}>{body}</Link>
            ) : (
              <div key={s.title} className={cls}>{body}</div>
            )
          })}
        </div>

        {/* PRÓXIMOS CHECK-INS (agenda, todos os imóveis) */}
        <section>
          <div className="mb-3.5 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 pl-1 text-base font-extrabold">
              <LogIn size={18} className="text-[#1A56DB]" /> Próximos check-ins
            </h2>
            <Link href={agendaHref} className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#1A56DB]">
              Ver agenda <ChevronRight size={14} />
            </Link>
          </div>
          {nextCheckins.length === 0 ? (
            <p className="rounded-3xl bg-white p-5 text-center text-sm text-[#64748B] ring-1 ring-black/5">
              Nenhum check-in nos próximos 7 dias
            </p>
          ) : (
            <div className="divide-y divide-gray-100 overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
              {nextCheckins.map((m) => {
                const src = SOURCE_META[m.booking.source]
                return (
                  <Link
                    key={m.booking.id}
                    href={`${agendaHref}?propertyId=${m.booking.propertyId}&mes=${m.date.slice(0, 7)}`}
                    className="flex items-center gap-3 px-4 py-3 transition active:bg-gray-50"
                  >
                    <span className="flex w-16 shrink-0 items-center justify-center rounded-xl bg-emerald-50 px-1 py-2 text-center text-[11px] font-bold capitalize leading-tight text-emerald-700">
                      {dayLabel(m.date)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{m.propertyName}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#64748B]">
                        <span className="h-2 w-2 rounded-full" style={{ background: src.color }} />
                        {src.label}
                        {m.booking.guestsCount ? <span>· {m.booking.guestsCount} hósp.</span> : null}
                      </span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-[#94A3B8]" />
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* CONFLITOS DE DATAS (agenda) */}
        {conflicts.length > 0 && (
          <section>
            <SectionTitle icon={AlertCircle}>Precisa da sua atenção</SectionTitle>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {conflicts.map((c) => (
                <ConflictCard
                  key={`${c.a.id}-${c.b.id}`}
                  conflict={c}
                  showProperty
                  agendaHref={`/${locale}/anfitriao/agenda?propertyId=${c.propertyId}&mes=${c.a.startDate.slice(0, 7)}`}
                />
              ))}
            </div>
          </section>
        )}

        {/* GUIA DO HÓSPEDE */}
        <section>
          <SectionTitle icon={BookOpen}>Guia do hóspede</SectionTitle>
          {properties.length === 0 ? (
            <p className="rounded-3xl bg-white p-5 text-sm text-[#64748B] ring-1 ring-black/5">Nenhum imóvel ativo.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((p) => {
                const count = p._count.partners
                const guiaUrl = `${origin}/guia/${p.id}`
                return (
                  <div key={p.id} className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_24px_-8px_rgba(26,86,219,0.25)] ring-1 ring-[#1A56DB]/[0.06]">
                    <div className="relative h-28 bg-gradient-to-br from-[#1A56DB] to-[#0F172A]">
                      {p.coverImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <p className="truncate text-base font-bold">{p.name}</p>
                        <p className="flex items-center gap-1 text-xs text-white/75">
                          <MapPin size={11} /> {formatCityState(p.city, p.state)}
                        </p>
                      </div>
                      <span
                        className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${
                          count === 0 ? 'bg-orange-500 text-white' : 'bg-white/90 text-[#0F172A]'
                        }`}
                      >
                        {count === 0 ? 'Guia vazio' : `${count} ${count === 1 ? 'botão' : 'botões'}`}
                      </span>
                    </div>

                    <div className="space-y-2 p-4">
                      <a
                        href={`/guia/${p.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#1A56DB] text-sm font-semibold text-white transition hover:bg-[#1648C0] active:scale-[0.98]"
                      >
                        <Eye size={16} /> Ver como hóspede
                      </a>
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href={`/${locale}/anfitriao/guia?propertyId=${p.id}`}
                          className="flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-[#F1F5FF] text-xs font-semibold text-[#1A56DB] transition active:scale-[0.98]"
                        >
                          <SlidersHorizontal size={14} /> Configurar botões
                        </Link>
                        <GuiaCopyButton
                          text={guiaUrl}
                          toast="Link do guia copiado"
                          className="flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-[#F1F5FF] text-xs font-semibold text-[#1A56DB] transition active:scale-[0.98]"
                        >
                          <Link2 size={14} /> Copiar link
                        </GuiaCopyButton>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* NAVEGAÇÃO */}
        <section>
          <SectionTitle icon={Settings}>Administração</SectionTitle>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {navItems.map((item) => {
              const body = (
                <>
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.iconCls}`}>
                    <item.icon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{item.title}</span>
                    <span className="block text-xs text-[#64748B]">{item.desc}</span>
                  </span>
                  {item.href ? (
                    <ChevronRight size={18} className="shrink-0 text-[#94A3B8]" />
                  ) : (
                    <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[0.65rem] font-bold text-gray-500">Em breve</span>
                  )}
                </>
              )
              const cls = 'flex items-center gap-3.5 rounded-3xl bg-white p-4 shadow-[0_4px_16px_-8px_rgba(26,86,219,0.2)] ring-1 ring-black/5'
              return item.href ? (
                <Link key={item.title} href={item.href} className={`${cls} transition active:scale-[0.98]`}>
                  {body}
                </Link>
              ) : (
                <div key={item.title} aria-disabled="true" className={`${cls} cursor-not-allowed opacity-60`}>
                  {body}
                </div>
              )
            })}
          </div>
        </section>

        {/* VISUALIZAR COMO */}
        <section className="rounded-3xl bg-white p-5 ring-1 ring-black/5">
          <p className="text-sm font-bold">Visualizar como</p>
          <p className="mb-4 text-xs text-[#64748B]">Acesse o dashboard de qualquer persona para testar</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
            {quickAccess.map((route) => (
              <Link
                key={route.role}
                href={route.href}
                target="_blank"
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-gray-200 px-3 py-2.5 text-xs font-medium text-gray-700 transition hover:border-[#1A56DB] hover:bg-blue-50 hover:text-[#1A56DB] active:scale-[0.98]"
              >
                <ExternalLink size={11} className="opacity-50" />
                {route.label}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <SomarFooter className="mt-6" />
    </div>
  )
}

function SectionTitle({ icon: Icon, children }: { icon: React.ComponentType<{ size?: number; className?: string }>; children: React.ReactNode }) {
  return (
    <h2 className="mb-3.5 flex items-center gap-2 pl-1 text-base font-extrabold">
      <Icon size={18} className="text-[#1A56DB]" />
      {children}
    </h2>
  )
}
