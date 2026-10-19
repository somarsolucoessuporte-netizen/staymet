import Link from 'next/link'
import { CalendarDots, PlugsConnected, SignIn, SignOut, CaretRight } from '@phosphor-icons/react/ssr'
import { prisma } from '@/lib/prisma'
import { getCurrentDbUser } from '@/lib/guia-access'
import { listAgendaProperties, getConflicts, getUpcomingMovements, serializeBooking } from '@/lib/agenda-server'
import { addDays, bookingLabel, echoIds, isoToDate, todayISO, SOURCE_META } from '@/lib/agenda'
import { AgendaCalendar } from '@/components/agenda/AgendaCalendar'
import { ConflictCard } from '@/components/agenda/ConflictCard'
import { PropertyChips } from '@/components/agenda/PropertyChips'
import { SyncNowButton } from '@/components/agenda/SyncNowButton'

const monthFmt = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('pt-BR') + s.slice(1)

function shiftMonth(month: string, delta: number) {
  const d = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + delta, 1))
  return d.toISOString().slice(0, 7)
}

export default async function AgendaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ propertyId?: string; mes?: string }>
}) {
  const { locale } = await params
  const { propertyId, mes } = await searchParams
  const dbUser = await getCurrentDbUser()
  if (!dbUser) return null

  const properties = await listAgendaProperties(dbUser)
  if (properties.length === 0) {
    return (
      <div className="font-display space-y-2 p-4 pt-6">
        <h1 className="text-xl font-extrabold">Agenda</h1>
        <p className="text-sm text-[#64748B]">Você ainda não está vinculado a nenhum imóvel.</p>
      </div>
    )
  }

  const selected = properties.find((p) => p.id === propertyId) ?? properties[0]
  const today = todayISO()
  const month = mes && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes) ? mes : today.slice(0, 7)
  const base = `/${locale}/anfitriao/agenda`
  const hrefFor = (id: string, m = month) => `${base}?propertyId=${id}&mes=${m}`

  // Janela da grade (com sobras do mês anterior/seguinte)
  const gridStart = addDays(`${month}-01`, -7)
  const gridEnd = addDays(`${shiftMonth(month, 1)}-01`, 7)

  const [rows, conflicts, moves, channels] = await Promise.all([
    prisma.booking.findMany({
      where: {
        propertyId: selected.id,
        status: 'CONFIRMADA',
        startDate: { lt: isoToDate(gridEnd) },
        endDate: { gte: isoToDate(gridStart) },
      },
      include: { channel: { select: { platform: true } } },
      orderBy: { startDate: 'asc' },
    }),
    getConflicts([selected.id]),
    getUpcomingMovements(properties.map((p) => p.id)),
    prisma.calendarChannel.findMany({
      where: { propertyId: selected.id },
      select: { lastStatus: true },
    }),
  ])

  const all = rows.map(serializeBooking)
  // Bloqueios-espelho de outras plataformas não aparecem (as datas já estão na reserva original)
  const echoes = echoIds(all)
  const bookings = all.filter((b) => !echoes.has(b.id))
  const conflictIds = [...new Set(conflicts.flatMap((c) => [c.a.id, c.b.id]))]
  const channelErrors = channels.filter((c) => c.lastStatus === 'ERRO').length

  const tomorrow = addDays(today, 1)
  const moveGroups = [
    { title: 'Hoje', items: moves.filter((m) => m.date === today) },
    { title: 'Amanhã', items: moves.filter((m) => m.date === tomorrow) },
    { title: 'Próximos 7 dias', items: moves.filter((m) => m.date > tomorrow) },
  ]
  const shortDay = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' })

  return (
    <div className="font-display space-y-5 p-4 pt-6 text-[#0F172A]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold">
            <CalendarDots size={22} className="text-[#1A56DB]" /> Agenda
          </h1>
          <p className="text-sm text-[#64748B]">Airbnb, Booking, Vrbo e reservas diretas num só calendário</p>
        </div>
      </div>

      <PropertyChips properties={properties} selectedId={selected.id} hrefFor={(id) => hrefFor(id)} />

      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`${base}/canais?propertyId=${selected.id}`}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#F1F5FF] px-3 text-xs font-semibold text-[#1A56DB] active:scale-[0.98]"
        >
          <PlugsConnected size={16} weight="bold" /> Canais ({channels.length})
          {channelErrors > 0 && <span className="rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">{channelErrors} erro</span>}
        </Link>
        <SyncNowButton propertyId={selected.id} />
      </div>

      {conflicts.length > 0 && (
        <div className="space-y-2">
          {conflicts.map((c) => <ConflictCard key={`${c.a.id}-${c.b.id}`} conflict={c} />)}
        </div>
      )}

      <AgendaCalendar
        key={`${selected.id}-${month}`}
        propertyId={selected.id}
        month={month}
        monthLabel={capitalize(monthFmt.format(isoToDate(`${month}-01`)))}
        today={today}
        bookings={bookings}
        conflictIds={conflictIds}
        prevHref={hrefFor(selected.id, shiftMonth(month, -1))}
        nextHref={hrefFor(selected.id, shiftMonth(month, 1))}
      />

      {/* PRÓXIMOS CHECK-INS E CHECK-OUTS */}
      <section>
        <h2 className="mb-3 pl-1 text-base font-extrabold">Próximos check-ins e check-outs</h2>
        {moves.length === 0 ? (
          <p className="rounded-3xl bg-white p-5 text-center text-sm text-[#64748B] ring-1 ring-black/5">Nada nos próximos 7 dias.</p>
        ) : (
          <div className="space-y-4">
            {moveGroups.filter((g) => g.items.length).map((g) => (
              <div key={g.title}>
                <p className="mb-1.5 pl-1 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">{g.title}</p>
                <div className="divide-y divide-gray-100 overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
                  {g.items.map((m) => {
                    const isIn = m.kind === 'checkin'
                    return (
                      <Link
                        key={`${m.kind}-${m.booking.id}`}
                        href={hrefFor(m.booking.propertyId, m.date.slice(0, 7))}
                        className="flex items-center gap-3 px-4 py-3 active:bg-gray-50"
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isIn ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                          {isIn ? <SignIn size={18} weight="bold" /> : <SignOut size={18} weight="bold" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">
                            {isIn ? 'Check-in' : 'Check-out'} · {bookingLabel(m.booking)}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#64748B]">
                            <span className="h-2 w-2 rounded-full" style={{ background: SOURCE_META[m.booking.source].color }} />
                            {g.title !== 'Hoje' && g.title !== 'Amanhã' && <span>{shortDay.format(isoToDate(m.date))} ·</span>}
                            {properties.length > 1 && <span className="truncate">{m.propertyName}</span>}
                            {m.booking.guestsCount && <span>· {m.booking.guestsCount} hósp.</span>}
                          </span>
                        </span>
                        <CaretRight size={16} className="shrink-0 text-[#94A3B8]" />
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
