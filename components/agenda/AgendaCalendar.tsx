'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  CaretLeft, CaretRight, Plus, Prohibit, SignIn, SignOut, Bed, Users, CurrencyCircleDollar, Phone, NoteBlank,
  WarningCircle, Trash, CircleNotch,
} from '@phosphor-icons/react/ssr'
import { useToast } from '@/components/ui/toast'
import { BookingDialog, type BookingDialogKind } from '@/components/agenda/BookingDialog'
import { cancelManualBooking } from '@/lib/actions/agenda'
import {
  addDays, bookingLabel, bookingRange, isoToDate, SOURCE_META, type AgendaBooking, type BookingSourceValue,
} from '@/lib/agenda'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MAX_LANES = 3

const longDay = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('pt-BR') + s.slice(1)

/** Faixa por reserva: o check-out de uma e o check-in da próxima dividem a mesma faixa (meio dia cada) */
function assignLanes(bookings: AgendaBooking[]) {
  const lanes: string[] = []
  const laneOf = new Map<string, number>()
  for (const b of [...bookings].sort((x, y) => x.startDate.localeCompare(y.startDate))) {
    let lane = lanes.findIndex((end) => end <= b.startDate)
    if (lane < 0) lane = lanes.length
    lanes[lane] = b.endDate
    laneOf.set(b.id, lane)
  }
  return laneOf
}

export function AgendaCalendar({
  propertyId,
  month,
  monthLabel,
  today,
  bookings,
  conflictIds,
  prevHref,
  nextHref,
}: {
  propertyId: string
  month: string
  monthLabel: string
  today: string
  bookings: AgendaBooking[]
  conflictIds: string[]
  prevHref: string
  nextHref: string
}) {
  const [selected, setSelected] = useState<string | null>(month === today.slice(0, 7) ? today : null)
  const [dialog, setDialog] = useState<BookingDialogKind | null>(null)

  const conflicts = useMemo(() => new Set(conflictIds), [conflictIds])
  const laneOf = useMemo(() => assignLanes(bookings), [bookings])

  const first = `${month}-01`
  const lead = isoToDate(first).getUTCDay()
  const daysInMonth = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate()
  const cells = Array.from({ length: Math.ceil((lead + daysInMonth) / 7) * 7 }, (_, i) => addDays(first, i - lead))

  const touching = (d: string) => bookings.filter((b) => b.startDate <= d && d <= b.endDate)
  const conflictDay = (d: string) => bookings.filter((b) => conflicts.has(b.id) && b.startDate <= d && d < b.endDate).length >= 2
  const usedSources = [...new Set(bookings.map((b) => b.source))] as BookingSourceValue[]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setDialog('RESERVA')}
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#1A56DB] text-sm font-semibold text-white shadow-sm transition hover:bg-[#1648C0] active:scale-[0.98]"
        >
          <Plus size={16} weight="bold" /> Reserva
        </button>
        <button
          type="button"
          onClick={() => setDialog('BLOQUEIO')}
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-white text-sm font-semibold text-[#0F172A] ring-1 ring-black/10 transition active:scale-[0.98]"
        >
          <Prohibit size={16} weight="bold" /> Bloquear datas
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_24px_-10px_rgba(26,86,219,0.25)] ring-1 ring-black/5">
        {/* Mês */}
        <div className="flex items-center justify-between px-2 py-2.5">
          <Link href={prevHref} scroll={false} aria-label="Mês anterior" className="flex h-10 w-10 items-center justify-center rounded-xl text-[#475569] hover:bg-gray-100">
            <CaretLeft size={18} weight="bold" />
          </Link>
          <p className="text-base font-extrabold">{monthLabel}</p>
          <Link href={nextHref} scroll={false} aria-label="Próximo mês" className="flex h-10 w-10 items-center justify-center rounded-xl text-[#475569] hover:bg-gray-100">
            <CaretRight size={18} weight="bold" />
          </Link>
        </div>

        <div className="grid grid-cols-7 border-t border-gray-100 text-center text-[11px] font-bold text-[#94A3B8]">
          {WEEKDAYS.map((w, i) => <span key={i} className="py-1.5">{w}</span>)}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((d) => {
            const inMonth = d.startsWith(month)
            const items = touching(d).filter((b) => (laneOf.get(b.id) ?? 0) < MAX_LANES)
            const extra = touching(d).length - items.length
            const isSel = d === selected
            const conflict = conflictDay(d)
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelected(d)}
                aria-label={capitalize(longDay.format(isoToDate(d)))}
                aria-pressed={isSel}
                className={cn(
                  'relative flex h-16 flex-col border-t border-gray-100 pt-1 text-left transition',
                  !inMonth && 'bg-[#F8FAFC]',
                  isSel && 'bg-[#F1F5FF]',
                )}
              >
                <span
                  className={cn(
                    'ml-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                    inMonth ? 'text-[#0F172A]' : 'text-[#CBD5E1]',
                    d === today && 'bg-[#1A56DB] text-white',
                  )}
                >
                  {Number(d.slice(8))}
                </span>
                {conflict && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" aria-label="Conflito" />}
                <span className="relative mt-auto mb-1.5 block h-[22px] w-full">
                  {items.map((b) => {
                    const lane = laneOf.get(b.id) ?? 0
                    const isStart = b.startDate === d
                    const isEnd = b.endDate === d
                    return (
                      <span
                        key={b.id}
                        className={cn(
                          'absolute h-1.5',
                          isStart && isEnd ? 'hidden' : isStart ? 'left-1/2 right-0 rounded-l-full' : isEnd ? 'left-0 right-1/2 rounded-r-full' : 'inset-x-0',
                          conflicts.has(b.id) && 'outline outline-1 outline-red-500',
                        )}
                        style={{ top: lane * 8, background: SOURCE_META[b.source].color, opacity: inMonth ? 1 : 0.45 }}
                      />
                    )
                  })}
                  {extra > 0 && <span className="absolute -top-3 right-1 text-[9px] font-bold text-[#64748B]">+{extra}</span>}
                </span>
              </button>
            )
          })}
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 border-t border-gray-100 px-4 py-3">
          {(Object.keys(SOURCE_META) as BookingSourceValue[])
            .filter((s) => usedSources.includes(s) || ['AIRBNB', 'BOOKING', 'VRBO', 'DIRETO', 'BLOQUEIO'].includes(s))
            .map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#475569]">
                <span className="h-2 w-4 rounded-full" style={{ background: SOURCE_META[s].color }} />
                {SOURCE_META[s].label}
              </span>
            ))}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600">
            <span className="h-2 w-2 rounded-full bg-red-500" /> Conflito
          </span>
        </div>
      </div>

      {selected && (
        <DayDetail propertyId={propertyId} day={selected} bookings={touching(selected)} conflicts={conflicts} onAdd={setDialog} />
      )}

      <BookingDialog
        propertyId={propertyId}
        kind={dialog}
        defaultStart={selected && selected >= today ? selected : today}
        onClose={() => setDialog(null)}
      />
    </div>
  )
}

function DayDetail({
  propertyId,
  day,
  bookings,
  conflicts,
  onAdd,
}: {
  propertyId: string
  day: string
  bookings: AgendaBooking[]
  conflicts: Set<string>
  onAdd: (k: BookingDialogKind) => void
}) {
  const groups = [
    { key: 'out', title: 'Check-out', Icon: SignOut, items: bookings.filter((b) => b.endDate === day) },
    { key: 'in', title: 'Check-in', Icon: SignIn, items: bookings.filter((b) => b.startDate === day) },
    { key: 'stay', title: 'Hospedado', Icon: Bed, items: bookings.filter((b) => b.startDate < day && day < b.endDate) },
  ].filter((g) => g.items.length)

  return (
    <section className="rounded-3xl bg-white p-4 ring-1 ring-black/5">
      <h3 className="text-sm font-extrabold">{capitalize(longDay.format(isoToDate(day)))}</h3>
      {groups.length === 0 ? (
        <div className="mt-2 space-y-3">
          <p className="text-sm text-[#64748B]">Dia livre.</p>
          <button type="button" onClick={() => onAdd('RESERVA')} className="text-sm font-semibold text-[#1A56DB]">
            + Lançar reserva a partir deste dia
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          {groups.map((g) => (
            <div key={g.key} className="space-y-2">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                <g.Icon size={14} weight="bold" /> {g.title}
              </p>
              {g.items.map((b) => (
                <BookingItem key={`${g.key}-${b.id}`} propertyId={propertyId} booking={b} conflict={conflicts.has(b.id)} />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function BookingItem({ propertyId, booking: b, conflict }: { propertyId: string; booking: AgendaBooking; conflict: boolean }) {
  const [confirm, setConfirm] = useState(false)
  const [busy, startTransition] = useTransition()
  const { toast } = useToast()
  const manual = !b.channelId
  const contactDigits = (b.guestContact ?? '').replace(/\D/g, '')
  const waDigits = contactDigits.length === 10 || contactDigits.length === 11 ? `55${contactDigits}` : contactDigits

  const cancel = () =>
    startTransition(async () => {
      const res = await cancelManualBooking(propertyId, b.id)
      toast(res.ok ? { title: b.source === 'BLOQUEIO' ? 'Bloqueio removido' : 'Reserva cancelada', variant: 'success' } : { title: 'Erro', description: res.error, variant: 'error' })
    })

  return (
    <div className={cn('rounded-2xl border p-3', conflict ? 'border-red-200 bg-red-50/60' : 'border-[#E2E8F0]')}>
      <div className="flex items-start gap-2.5">
        <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: SOURCE_META[b.source].color }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{bookingLabel(b)}</p>
          <p className="text-xs text-[#64748B]">{bookingRange(b)}</p>
          {conflict && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
              <WarningCircle size={12} weight="fill" /> Conflito de datas
            </span>
          )}
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#475569]">
            {b.guestsCount && <span className="inline-flex items-center gap-1"><Users size={13} /> {b.guestsCount}</span>}
            {b.amount && (
              <span className="inline-flex items-center gap-1">
                <CurrencyCircleDollar size={13} /> {Number(b.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            )}
            {b.guestContact && (
              <a
                href={waDigits.length >= 12 ? `https://wa.me/${waDigits}` : `tel:${contactDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[#1A56DB]"
              >
                <Phone size={13} /> {b.guestContact}
              </a>
            )}
          </div>
          {b.notes && <p className="mt-1 flex items-start gap-1 text-xs text-[#64748B]"><NoteBlank size={13} className="mt-px shrink-0" /> {b.notes}</p>}
          {!manual && <p className="mt-1 text-[11px] text-[#94A3B8]">Veio do canal · altere na plataforma</p>}
        </div>
        {manual &&
          (confirm ? (
            <span className="flex shrink-0 items-center gap-1 text-xs">
              <button type="button" disabled={busy} onClick={cancel} className="flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1.5 font-semibold text-white">
                {busy && <CircleNotch size={12} className="animate-spin" />} {b.source === 'BLOQUEIO' ? 'Remover' : 'Cancelar'}
              </button>
              <button type="button" onClick={() => setConfirm(false)} className="rounded-lg bg-gray-100 px-2 py-1.5 font-semibold text-gray-700">
                Não
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirm(true)}
              aria-label={b.source === 'BLOQUEIO' ? 'Remover bloqueio' : 'Cancelar reserva'}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
            >
              <Trash size={17} />
            </button>
          ))}
      </div>
    </div>
  )
}
