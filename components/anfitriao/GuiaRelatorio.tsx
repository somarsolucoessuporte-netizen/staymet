import Link from 'next/link'
import { ChatCircleDots, NavigationArrow, Phone, WhatsappLogo } from '@phosphor-icons/react/ssr'
import { fmtDate, fmtMonth, PERIODS, type Periodo, type ReportRange } from '@/lib/guide-report'
import type { getPartnerReport } from '@/lib/guide-report'
import { cn } from '@/lib/utils'

// Peças do relatório de uso do guia (servidor). Mesmo visual do painel: cards brancos rounded-3xl, azul #1A56DB.

export const CARD = 'rounded-3xl bg-white p-5 ring-1 ring-black/5 shadow-[0_4px_16px_-8px_rgba(26,86,219,0.2)] print:shadow-none'

/** Chips de período; href monta o link de cada um preservando os outros parâmetros */
export function PeriodChips({ current, options, href }: { current: Periodo; options: Periodo[]; href: (p: Periodo) => string }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 print:hidden">
      {options.map((p) => (
        <Link
          key={p}
          href={href(p)}
          scroll={false}
          className={cn(
            'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition',
            p === current ? 'bg-[#1A56DB] text-white ring-[#1A56DB]' : 'bg-white text-[#334155] ring-black/10 hover:bg-[#F1F5FF]',
          )}
        >
          {PERIODS[p]}
        </Link>
      ))}
    </div>
  )
}

export function StatTile({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 ring-1 ring-black/5 shadow-[0_8px_24px_-8px_rgba(26,86,219,0.25)] print:shadow-none">
      {icon}
      <p className="mt-2 text-2xl font-extrabold tabular-nums text-[#0F172A]">{value.toLocaleString('pt-BR')}</p>
      <p className="text-xs font-medium leading-tight text-[#64748B]">{label}</p>
    </div>
  )
}

/** Cliques por semana: barras finas de uma cor só, com valor no toque/hover e tabela para leitor de tela */
export function WeeklyChart({ weeks }: { weeks: { week: string; n: number }[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.n))
  const every = weeks.length > 8 ? 2 : 1
  return (
    <div>
      <div className="relative flex h-40 items-end gap-1 border-b border-[#E2E8F0] pt-6" aria-hidden>
        <span className="absolute left-0 top-0 text-[10px] font-medium tabular-nums text-[#94A3B8]">{max}</span>
        <span className="absolute inset-x-0 top-2 border-t border-dashed border-[#E2E8F0]" />
        {weeks.map((w) => (
          <div key={w.week} tabIndex={0} className="group relative flex h-full flex-1 items-end justify-center outline-none">
            <div
              className="w-full max-w-7 rounded-t-[4px] bg-[#1A56DB] transition-opacity group-hover:opacity-80 group-focus:opacity-80"
              style={{ height: w.n ? `${Math.max(3, (w.n / max) * 100)}%` : '2px', opacity: w.n ? undefined : 0.25 }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0F172A] px-2 py-1 text-[11px] font-semibold text-white group-hover:block group-focus:block">
              Semana de {fmtDate(w.week).slice(0, 5)}: {w.n} {w.n === 1 ? 'clique' : 'cliques'}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1" aria-hidden>
        {weeks.map((w, i) => (
          <span key={w.week} className="flex-1 text-center text-[10px] tabular-nums text-[#94A3B8]">
            {i % every === 0 ? fmtDate(w.week).slice(0, 5) : ''}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Cliques por semana</caption>
        <thead><tr><th>Semana de</th><th>Cliques</th></tr></thead>
        <tbody>{weeks.map((w) => <tr key={w.week}><td>{fmtDate(w.week)}</td><td>{w.n}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

/** Origem das reservas: barras horizontais com rótulo e número (cor da plataforma só como marca) */
export function SourceBars({ sources }: { sources: { source: string | null; label: string; color: string; n: number }[] }) {
  const total = sources.reduce((t, s) => t + s.n, 0)
  if (total === 0) return <p className="text-sm text-[#64748B]">Sem cliques no período.</p>
  return (
    <ul className="space-y-3">
      {sources.map((s) => {
        const pct = Math.round((s.n / total) * 100)
        return (
          <li key={s.source ?? 'none'}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-semibold text-[#0F172A]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="tabular-nums text-[#475569]">{s.n} · {pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#F1F5F9]">
              <div className="h-full rounded-full" style={{ width: `${Math.max(2, pct)}%`, background: s.color }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Página do parceiro (painel e link público): frase-resumo, ações e total por mês */
export function PartnerReportView({
  partnerName,
  categoryLabel,
  propertyName,
  range,
  report,
}: {
  partnerName: string
  categoryLabel: string
  propertyName: string
  range: ReportRange
  report: Awaited<ReturnType<typeof getPartnerReport>>
}) {
  const { totals, byMonth } = report
  const between = `${fmtDate(range.fromISO)} e ${fmtDate(range.toISO)}`
  return (
    <div className="space-y-4">
      <section className={cn(CARD, 'bg-gradient-to-br from-[#0F3A7A] to-[#1A56DB] text-white ring-0 print:bg-none print:text-[#0F172A] print:ring-1')}>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70 print:text-[#64748B]">{categoryLabel}</p>
        <p className="mt-2 text-lg font-bold leading-snug">
          <span className="text-2xl font-extrabold">{partnerName}</span> recebeu{' '}
          <span className="text-2xl font-extrabold tabular-nums">{totals.total.toLocaleString('pt-BR')}</span>{' '}
          {totals.total === 1 ? 'contato' : 'contatos'} de hóspedes da {propertyName} via Staymet entre {between}.
        </p>
        {report.opens > 0 && (
          <p className="mt-2 text-sm text-white/80 print:text-[#475569]">
            Os hóspedes abriram o botão de {partnerName} {report.opens} {report.opens === 1 ? 'vez' : 'vezes'} no guia.
          </p>
        )}
      </section>

      <div className="grid grid-cols-3 gap-2.5">
        <StatTile icon={<WhatsappLogo size={26} weight="duotone" color="#16A34A" />} value={totals.whatsapp} label="WhatsApp" />
        <StatTile icon={<Phone size={26} weight="duotone" color="#1A56DB" />} value={totals.ligar} label="Ligações" />
        <StatTile icon={<NavigationArrow size={26} weight="duotone" color="#7C3AED" />} value={totals.rota} label="Rota ou site" />
      </div>

      <section className={CARD}>
        <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold">
          <ChatCircleDots size={22} weight="duotone" color="#1A56DB" /> Contatos por mês
        </h2>
        {byMonth.length === 0 ? (
          <p className="text-sm text-[#64748B]">Nenhum contato no período.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                <th className="pb-2 font-semibold">Mês</th>
                <th className="pb-2 text-right font-semibold">WhatsApp</th>
                <th className="pb-2 text-right font-semibold">Ligar</th>
                <th className="pb-2 text-right font-semibold">Rota</th>
                <th className="pb-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 tabular-nums">
              {byMonth.map((m) => (
                <tr key={m.month}>
                  <td className="py-2 font-semibold">{fmtMonth(m.month)}</td>
                  <td className="py-2 text-right">{m.whatsapp}</td>
                  <td className="py-2 text-right">{m.ligar}</td>
                  <td className="py-2 text-right">{m.rota}</td>
                  <td className="py-2 text-right font-bold">{m.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="px-1 text-[11px] leading-relaxed text-[#94A3B8]">
        Contagem de toques nos botões do guia digital da casa (WhatsApp, ligação, rota e site). Nenhum dado pessoal de hóspede é coletado.
      </p>
    </div>
  )
}
