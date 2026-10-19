import Link from 'next/link'
import { WarningCircle, WhatsappLogo, CaretRight } from '@phosphor-icons/react/ssr'
import { bookingLabel, conflictWhatsappHref, fmtDay } from '@/lib/agenda'
import type { PropertyConflict } from '@/lib/agenda-server'

/** Selo vermelho "Conflito de datas" com as duas reservas e o WhatsApp do anfitrião */
export function ConflictCard({ conflict: c, agendaHref, showProperty = false }: { conflict: PropertyConflict; agendaHref?: string; showProperty?: boolean }) {
  const line = (b: PropertyConflict['a']) => `${bookingLabel(b)} · ${fmtDay(b.startDate)} a ${fmtDay(b.endDate)}`
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-3">
      <div className="flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
          <WarningCircle size={18} weight="fill" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-red-700">Conflito de datas</p>
          {showProperty && <p className="truncate text-xs font-semibold text-[#0F172A]">{c.propertyName}</p>}
          <p className="mt-0.5 text-xs text-red-900">{line(c.a)}</p>
          <p className="text-xs text-red-900">{line(c.b)}</p>
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <a
          href={conflictWhatsappHref(c.hostPhone, c.propertyName, c.a, c.b)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] text-xs font-semibold text-white active:scale-[0.98]"
        >
          <WhatsappLogo size={16} weight="fill" /> Avisar anfitrião
        </a>
        {agendaHref ? (
          <Link href={agendaHref} className="flex h-9 items-center justify-center gap-1 rounded-xl bg-white text-xs font-semibold text-red-700 ring-1 ring-red-200 active:scale-[0.98]">
            Ver na agenda <CaretRight size={14} weight="bold" />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}
