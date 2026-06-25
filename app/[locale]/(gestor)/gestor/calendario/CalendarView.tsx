'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, LogIn, LogOut } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CalReservation {
  id: string
  guestName: string
  checkIn: Date
  checkOut: Date
  status: string
  property: { name: string }
}

interface CalendarViewProps {
  locale: string
  year: number
  month: number
  reservations: CalReservation[]
}

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const statusColors = [
  'bg-blue-400',
  'bg-emerald-400',
  'bg-purple-400',
  'bg-amber-400',
  'bg-pink-400',
  'bg-indigo-400',
  'bg-teal-400',
]

export function CalendarView({ locale, year, month, reservations }: CalendarViewProps) {
  const currentDate = new Date(year, month - 1, 1)
  const prevDate = subMonths(currentDate, 1)
  const nextDate = addMonths(currentDate, 1)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const firstDayOfWeek = getDay(monthStart)
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => i)

  const buildLink = (d: Date) =>
    `/${locale}/gestor/calendario?month=${d.getMonth() + 1}&year=${d.getFullYear()}`

  const colorMap = new Map<string, string>()
  reservations.forEach((r, i) => {
    colorMap.set(r.id, statusColors[i % statusColors.length])
  })

  const getCheckIns = (day: Date) =>
    reservations.filter((r) => isSameDay(new Date(r.checkIn), day))

  const getCheckOuts = (day: Date) =>
    reservations.filter((r) => isSameDay(new Date(r.checkOut), day))

  const today = new Date()

  return (
    <div className="p-5 lg:p-8 pb-24 lg:pb-8 max-w-4xl mx-auto">

      {/* Navegação de mês */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 capitalize" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {reservations.length} reserva{reservations.length !== 1 ? 's' : ''} neste mês
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={buildLink(prevDate)}
            className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ChevronLeft size={16} className="text-gray-600" />
          </Link>
          <Link
            href={buildLink(today)}
            className="h-9 px-4 rounded-xl bg-[#1A56DB] text-white text-sm font-medium hover:bg-[#1648C0] transition-colors shadow-sm flex items-center"
          >
            Hoje
          </Link>
          <Link
            href={buildLink(nextDate)}
            className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ChevronRight size={16} className="text-gray-600" />
          </Link>
        </div>
      </div>

      {/* Grid do calendário */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {/* Dias da semana */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {weekDays.map((d) => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Células do calendário */}
        <div className="grid grid-cols-7">
          {/* Padding inicial */}
          {paddingDays.map((i) => (
            <div key={`pad-${i}`} className="min-h-[80px] lg:min-h-[100px] border-b border-r border-gray-50 bg-gray-50/30" />
          ))}

          {days.map((day, idx) => {
            const isToday = isSameDay(day, today)
            const checkIns = getCheckIns(day)
            const checkOuts = getCheckOuts(day)
            const hasActivity = checkIns.length > 0 || checkOuts.length > 0
            const isLastCol = (firstDayOfWeek + idx) % 7 === 6

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[80px] lg:min-h-[100px] border-b border-r border-gray-50 p-1.5 lg:p-2 transition-colors ${
                  hasActivity ? 'bg-blue-50/30' : ''
                } ${isLastCol ? 'border-r-0' : ''}`}
              >
                {/* Número do dia */}
                <div className="flex justify-end mb-1">
                  <span className={`w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center ${
                    isToday
                      ? 'bg-[#1A56DB] text-white font-bold'
                      : 'text-gray-700'
                  }`}>
                    {day.getDate()}
                  </span>
                </div>

                {/* Eventos */}
                <div className="space-y-0.5">
                  {checkIns.slice(0, 2).map((r) => (
                    <div
                      key={`in-${r.id}`}
                      className="flex items-center gap-1 text-[10px] rounded-md px-1.5 py-0.5 bg-emerald-100 text-emerald-700 truncate"
                      title={`Check-in: ${r.guestName} — ${r.property.name}`}
                    >
                      <LogIn size={9} className="flex-shrink-0" />
                      <span className="truncate hidden lg:block">{r.property.name}</span>
                    </div>
                  ))}
                  {checkOuts.slice(0, 2).map((r) => (
                    <div
                      key={`out-${r.id}`}
                      className="flex items-center gap-1 text-[10px] rounded-md px-1.5 py-0.5 bg-blue-100 text-blue-700 truncate"
                      title={`Check-out: ${r.guestName} — ${r.property.name}`}
                    >
                      <LogOut size={9} className="flex-shrink-0" />
                      <span className="truncate hidden lg:block">{r.property.name}</span>
                    </div>
                  ))}
                  {(checkIns.length + checkOuts.length) > 4 && (
                    <p className="text-[9px] text-gray-400 pl-1">
                      +{checkIns.length + checkOuts.length - 4}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 mt-4 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />
          <span className="text-xs text-gray-500">Check-in</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
          <span className="text-xs text-gray-500">Check-out</span>
        </div>
      </div>

      {/* Lista de reservas do mês */}
      {reservations.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-900">Reservas do mês</p>
          </div>
          <div className="divide-y divide-gray-50">
            {reservations.map((r) => {
              const color = colorMap.get(r.id) ?? 'bg-gray-400'
              return (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-2 h-8 rounded-full ${color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{r.guestName}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{r.property.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-600">
                      {format(new Date(r.checkIn), 'dd/MM')} → {format(new Date(r.checkOut), 'dd/MM')}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{r.status}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
