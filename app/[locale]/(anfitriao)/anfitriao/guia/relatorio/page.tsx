import Link from 'next/link'
import { CaretRight, ChartBar, ChartLineUp, CursorClick, Eye, Ranking, SuitcaseRolling, WhatsappLogo } from '@phosphor-icons/react/ssr'
import { getCurrentDbUser, listGuiaProperties } from '@/lib/guia-access'
import { getPropertyReport, resolvePeriod, fmtDate, type Periodo } from '@/lib/guide-report'
import { CARD, PeriodChips, SourceBars, StatTile, WeeklyChart } from '@/components/anfitriao/GuiaRelatorio'
import { cn } from '@/lib/utils'

// Relatório de uso do guia do hóspede: aberturas, cliques, ranking dos botões, semanas e origem das reservas

const PERIOD_OPTIONS: Periodo[] = ['30d', 'mes', '90d']

export default async function GuiaRelatorioPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ propertyId?: string; periodo?: string }>
}) {
  const { locale } = await params
  const { propertyId, periodo } = await searchParams

  const dbUser = await getCurrentDbUser()
  if (!dbUser) return null
  const properties = await listGuiaProperties(dbUser)
  if (properties.length === 0) {
    return (
      <div className="space-y-2 p-4 pt-6">
        <h1 className="text-xl font-bold">Relatório de uso</h1>
        <p className="text-sm text-muted-foreground">Você ainda não está vinculado a nenhum imóvel.</p>
      </div>
    )
  }

  const selected = properties.find((p) => p.id === propertyId) ?? properties[0]
  const range = resolvePeriod(periodo, PERIOD_OPTIONS)
  const report = await getPropertyReport(selected.id, range)
  const base = `/${locale}/anfitriao/guia/relatorio`
  const partnerHref = (id: string) => `${base}/parceiro/${id}?propertyId=${selected.id}&periodo=${range.periodo}`

  return (
    <div className="space-y-5 p-4 pt-6 text-[#0F172A]">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <ChartLineUp size={24} weight="duotone" color="#1A56DB" /> Relatório de uso
        </h1>
        <p className="text-sm text-muted-foreground">
          {selected.name} · {fmtDate(range.fromISO)} a {fmtDate(range.toISO)}
        </p>
      </div>

      {properties.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {properties.map((p) => (
            <Link
              key={p.id}
              href={`${base}?propertyId=${p.id}&periodo=${range.periodo}`}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                p.id === selected.id ? 'border-primary bg-primary text-white' : 'border-border bg-card text-foreground hover:bg-muted',
              )}
            >
              {p.name}
            </Link>
          ))}
        </div>
      )}

      <PeriodChips current={range.periodo} options={PERIOD_OPTIONS} href={(p) => `${base}?propertyId=${selected.id}&periodo=${p}`} />

      <div className="grid grid-cols-3 gap-2.5">
        <StatTile icon={<Eye size={26} weight="duotone" color="#1A56DB" />} value={report.guideOpens} label="Aberturas do guia" />
        <StatTile icon={<CursorClick size={26} weight="duotone" color="#7C3AED" />} value={report.clicks} label="Cliques totais" />
        <StatTile icon={<WhatsappLogo size={26} weight="duotone" color="#16A34A" />} value={report.whatsapp} label="Contatos no WhatsApp" />
      </div>

      {/* Ranking dos botões */}
      <section className={CARD}>
        <h2 className="mb-1 flex items-center gap-2 text-base font-extrabold">
          <Ranking size={22} weight="duotone" color="#1A56DB" /> Botões mais usados
        </h2>
        <p className="mb-3 text-xs text-[#64748B]">Toque num parceiro para ver o relatório que você pode mandar para ele.</p>
        {report.ranking.length === 0 ? (
          <p className="text-sm text-[#64748B]">Ainda não há cliques neste período.</p>
        ) : (
          <ol className="divide-y divide-gray-100">
            {report.ranking.map((r, i) => {
              const body = (
                <>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-xs font-bold tabular-nums text-[#1A56DB]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    <p className="truncate text-xs text-[#64748B]">{r.category}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs tabular-nums text-[#475569]">
                    <p><span className="font-bold text-[#0F172A]">{r.opens}</span> {r.opens === 1 ? 'abertura' : 'aberturas'}</p>
                    <p><span className="font-bold text-[#0F172A]">{r.actions}</span> {r.actions === 1 ? 'ação' : 'ações'}</p>
                  </div>
                  {r.partnerId && <CaretRight size={16} className="shrink-0 text-[#94A3B8]" />}
                </>
              )
              return (
                <li key={r.key}>
                  {r.partnerId ? (
                    <Link href={partnerHref(r.partnerId)} className="-mx-2 flex items-center gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-[#F8FAFC]">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 py-2.5">{body}</div>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </section>

      {/* Cliques por semana */}
      <section className={CARD}>
        <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold">
          <ChartBar size={22} weight="duotone" color="#1A56DB" /> Cliques por semana
        </h2>
        <WeeklyChart weeks={report.weeks} />
      </section>

      {/* Origem das reservas */}
      <section className={CARD}>
        <h2 className="mb-1 flex items-center gap-2 text-base font-extrabold">
          <SuitcaseRolling size={22} weight="duotone" color="#1A56DB" /> Origem das reservas
        </h2>
        <p className="mb-3 text-xs text-[#64748B]">De onde veio a reserva em andamento no dia de cada clique (pela Agenda).</p>
        <SourceBars sources={report.sources} />
      </section>

      <p className="px-1 text-[11px] leading-relaxed text-[#94A3B8]">
        O guia conta só toques nos botões, sem nenhum dado pessoal do hóspede. A abertura do guia conta uma vez por visita.
      </p>
    </div>
  )
}
